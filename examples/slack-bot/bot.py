"""
Streamlined Malloy Slack Bot with Direct LLM-to-MCP Integration

This bot implements a simplified architecture where:
- LLM agents have direct access to raw MCP (Model Context Protocol) tool responses
- Minimal response parsing - the LLM handles data interpretation naturally
- Supports multi-turn conversations with context preservation across Slack threads
- Production-ready with circuit breaker pattern, health monitoring, and auto-reconnection
- Configurable LLM providers (OpenAI, Anthropic, Google Vertex AI)
"""

import os
import json
import logging
import argparse
import time
from typing import Dict, List, Any
from threading import Event
from dataclasses import dataclass
from dotenv import load_dotenv

from slack_sdk.socket_mode import SocketModeClient
from slack_sdk.web import WebClient
from slack_sdk.socket_mode.request import SocketModeRequest
from slack_sdk.socket_mode.client import BaseSocketModeClient
from src.agents.langchain_compatibility_adapter import LangChainCompatibilityAdapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ServiceHealth:
    """Monitor the operational status of critical bot components
    
    Tracks connectivity and availability of:
    - Malloy agent (LLM + MCP integration)
    - Slack client connections
    - MCP server availability
    """
    malloy_agent: bool = False
    slack_client: bool = False
    mcp_server: bool = False
    
class CircuitBreaker:
    """Circuit breaker pattern to prevent cascading failures from MCP server issues
    
    Automatically opens (stops requests) when failure threshold is reached,
    then gradually allows requests after timeout period to test recovery.
    """
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    def is_open(self) -> bool:
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
                return False
            return True
        return False
    
    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker OPEN - MCP failures: {self.failure_count}")

def parse_args():
    """Parse command line arguments for LLM model and provider configuration
    
    Returns:
        argparse.Namespace: Parsed arguments including model choice and optional provider override
    """
    parser = argparse.ArgumentParser(description='Malloy Slack Bot')
    parser.add_argument('--model', choices=[
        'gpt-4o', 'gpt-4o-mini', 
        'gemini-1.5-pro', 'gemini-2.5-flash',
        'claude-3-5-sonnet-20241022', 'claude-3-7-sonnet', 
        'claude-sonnet-4-20250514', 'claude-opus-4-20250514',
        'claude-3-5-haiku-20241022'
    ], default='claude-3-5-sonnet-20241022', help='LLM model to use')
    parser.add_argument('--provider', choices=['openai', 'vertex', 'anthropic'], 
                       help='LLM provider (auto-detected from model if not specified)')
    return parser.parse_args()

def get_provider_from_model(model_name: str) -> str:
    """Auto-detect LLM provider based on model name prefix
    
    Args:
        model_name: Name of the LLM model (e.g., 'gpt-4o', 'claude-3-5-sonnet')
        
    Returns:
        str: Provider name ('openai', 'anthropic', or 'vertex')
    """
    if model_name.startswith('gpt'):
        return 'openai'
    elif model_name.startswith('gemini'):
        return 'vertex'
    elif model_name.startswith('claude'):
        return 'anthropic'
    else:
        return 'openai'  # Default

# Global variables
malloy_agent = None
CONVERSATION_CACHE: Dict[str, List[Dict[str, Any]]] = {}
web_client = None
socket_mode_client = None
service_health = ServiceHealth()
circuit_breaker = CircuitBreaker()
shutdown_event = Event()

# Conversation cleanup settings
MAX_CONVERSATIONS = 100
CONVERSATION_TTL_HOURS = 24

def cleanup_old_conversations():
    """Clean up old conversations to prevent memory leaks"""
    global CONVERSATION_CACHE
    
    if len(CONVERSATION_CACHE) <= MAX_CONVERSATIONS:
        return
    
    current_time = time.time()
    cutoff_time = current_time - (CONVERSATION_TTL_HOURS * 3600)
    
    # Sort by timestamp and remove oldest
    conversations_by_time = []
    for conv_id, history in CONVERSATION_CACHE.items():
        # Use conversation ID as timestamp if it's numeric, otherwise use current time
        try:
            timestamp = float(conv_id)
        except:
            timestamp = current_time
        conversations_by_time.append((timestamp, conv_id))
    
    conversations_by_time.sort()
    
    # Remove oldest conversations if we exceed limits
    while len(CONVERSATION_CACHE) > MAX_CONVERSATIONS:
        _, oldest_id = conversations_by_time.pop(0)
        CONVERSATION_CACHE.pop(oldest_id, None)
        logger.info(f"Cleaned up old conversation: {oldest_id}")

def init_bot(model: str = 'gpt-4o', provider: str = None):
    """Initialize all bot components including LLM agent and Slack clients
    
    Args:
        model: LLM model name (e.g., 'gpt-4o', 'claude-3-5-sonnet')
        provider: Optional provider override ('openai', 'anthropic', 'vertex')
        
    Returns:
        tuple: (malloy_agent, web_client, socket_mode_client)
        
    Raises:
        ValueError: If required environment variables are missing
        Exception: If initialization of any component fails
    """
    global malloy_agent, web_client, socket_mode_client
    
    LLM_MODEL = model
    LLM_PROVIDER = provider or get_provider_from_model(LLM_MODEL)

    # Set API keys and tokens (will raise KeyError if missing)
    try:
        SLACK_BOT_TOKEN = os.environ["SLACK_BOT_TOKEN"].strip()
        SLACK_APP_TOKEN = os.environ["SLACK_APP_TOKEN"].strip()
        OPENAI_API_KEY = os.environ["OPENAI_API_KEY"].strip()
        MCP_URL = os.environ.get("MCP_URL", "http://localhost:4040/mcp")
        
        # Anthropic configuration  
        ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
        
        # Vertex AI configuration
        VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID")
        VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-central1")
        
    except KeyError as e:
        raise ValueError(f"Missing required environment variable: {e}")

    # Log model configuration for debugging
    logger.info(f"🤖 Initializing Malloy Agent with:")
    logger.info(f"   - LLM Provider: {LLM_PROVIDER} (from {'command line' if provider else 'auto-detect'})")
    logger.info(f"   - LLM Model: {LLM_MODEL} (from command line)")
    logger.info(f"   - MCP URL: {MCP_URL}")
    if LLM_PROVIDER == "vertex":
        logger.info(f"   - Vertex Project: {VERTEX_PROJECT_ID}")
        logger.info(f"   - Vertex Location: {VERTEX_LOCATION}")
    elif LLM_PROVIDER == "anthropic":
        logger.info(f"   - Anthropic API Key: {'configured' if ANTHROPIC_API_KEY else 'NOT SET'}")

    # Initialize LangChain Malloy Agent
    try:
        malloy_agent = LangChainCompatibilityAdapter(
            openai_api_key=OPENAI_API_KEY,
            mcp_url=MCP_URL,
            llm_provider=LLM_PROVIDER,
            model_name=LLM_MODEL,
            anthropic_api_key=ANTHROPIC_API_KEY,
            vertex_project_id=VERTEX_PROJECT_ID,
            vertex_location=VERTEX_LOCATION
        )
        service_health.malloy_agent = True
        logger.info("✅ Malloy agent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Malloy agent: {e}")
        service_health.malloy_agent = False
        raise

    # Initialize Slack clients with error handling
    try:
        web_client = WebClient(token=SLACK_BOT_TOKEN)
        socket_mode_client = SocketModeClient(
            app_token=SLACK_APP_TOKEN,
            web_client=web_client
        )
        service_health.slack_client = True
        logger.info("✅ Slack clients initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Slack clients: {e}")
        service_health.slack_client = False
        raise
    
    return malloy_agent, web_client, socket_mode_client

def _strip_markdown_json(text: str) -> str:
    """Remove markdown code block formatting from JSON responses
    
    LLM responses sometimes wrap JSON in markdown code blocks like:
    ```json
    {"key": "value"}
    ```
    
    This function strips those delimiters to extract raw JSON for parsing.
    
    Args:
        text: Response text that may contain markdown-wrapped JSON
        
    Returns:
        str: Clean text with markdown code block markers removed
    """
    text = text.strip()
    # Check for ```json at the beginning
    if text.startswith("```json"):
        text = text[7:].strip()
    # Check for ``` at the beginning
    elif text.startswith("```"):
        text = text[3:].strip()
    
    # Check for ``` at the end
    if text.endswith("```"):
        text = text[:-3].strip()
        
    return text

def send_error_message(channel_id: str, thread_ts: str, error_type: str, error_details: str = ""):
    """Send user-friendly error messages based on failure type
    
    Provides contextual error messages for different failure scenarios:
    - agent_down: Malloy agent is unavailable
    - connection_error: MCP server connectivity issues  
    - processing_error: Query processing failures
    
    Args:
        channel_id: Slack channel to send message to
        thread_ts: Thread timestamp for threaded response
        error_type: Category of error for appropriate messaging
        error_details: Optional specific error information
    """
    try:
        if error_type == "agent_down":
            message = "🔧 The Malloy agent is currently down. Our team has been notified and we're working to restore service. Please try again in a few minutes."
        elif error_type == "connection_error":
            message = "🌐 I'm having trouble connecting to the data services. Please try again in a moment."
        elif error_type == "processing_error":
            message = f"⚠️ I encountered an error processing your request: {error_details}"
        else:
            message = "❌ Something went wrong. Please try again or contact support if the issue persists."
        
        web_client.chat_postMessage(
            channel=channel_id,
            thread_ts=thread_ts,
            text=message
        )
    except Exception as e:
        logger.error(f"Failed to send error message: {e}")

def process_slack_events(client: BaseSocketModeClient, req: SocketModeRequest):
    """Handle Slack events with intelligent conversation context management
    
    Processes app mentions and threaded messages while maintaining conversation
    history across multiple turns. Implements smart thread detection to:
    - Respond to direct mentions anywhere
    - Continue conversations in threads the bot initiated
    - Ignore unrelated threaded messages for focused interaction
    
    Args:
        client: Slack Socket Mode client instance
        req: Incoming Slack event request
    """
    global malloy_agent
    
    logger.info(f"🔍 SLACK EVENT: {req.type}")
    
    if req.type == "events_api":
        client.send_socket_mode_response({"envelope_id": req.envelope_id})

        event = req.payload.get("event", {})
        logger.info(f"🔍 EVENT DETAILS: type={event.get('type')}, user={event.get('user')}, ts={event.get('ts')}, thread_ts={event.get('thread_ts')}")
        
        # Handle both app_mention and message events
        event_type = event.get("type")
        
        # Check if this is an event we should respond to
        should_respond = False
        
        if event_type == "app_mention":
            should_respond = True
        elif event_type == "message" and event.get("thread_ts"):
            # Only respond to threaded messages if:
            # 1. Bot was mentioned in this message, OR  
            # 2. Bot started this thread (has existing conversation in this thread)
            text = event.get("text", "").strip()
            thread_ts = event.get("thread_ts")
            bot_user_id = None
            
            logger.info(f"🧵 Threaded message received: text='{text}', thread_ts='{thread_ts}'")
            logger.info(f"🧵 Current conversation cache keys: {list(CONVERSATION_CACHE.keys())}")
            
            try:
                bot_user_id = web_client.auth_test()["user_id"]
            except Exception as e:
                logger.warning(f"Failed to get bot user ID: {e}")
                return
            
            # Check if bot was mentioned in this threaded message
            if f"<@{bot_user_id}>" in text:
                should_respond = True
                logger.info(f"🧵 Bot mentioned in threaded message - will respond")
            # Check if bot started this thread (has existing conversation)
            elif thread_ts in CONVERSATION_CACHE:
                should_respond = True
                logger.info(f"🧵 Continuing bot-started conversation in thread {thread_ts}")
            else:
                # Try to find conversation with similar timestamp (fallback for timing mismatches)
                found_conversation = False
                for cached_id in CONVERSATION_CACHE.keys():
                    # Check if the timestamps are very close (within 1 second)
                    try:
                        thread_time = float(thread_ts)
                        cached_time = float(cached_id)
                        if abs(thread_time - cached_time) < 1.0:
                            should_respond = True
                            logger.info(f"🧵 Found close conversation match: thread_ts={thread_ts}, cached_id={cached_id}")
                            found_conversation = True
                            break
                    except (ValueError, TypeError):
                        continue
                
                if not found_conversation:
                    should_respond = False
                    logger.info(f"🧵 Ignoring threaded message - bot not mentioned and didn't start this thread")
                    logger.info(f"🧵 Looking for thread_ts '{thread_ts}' but cache has: {list(CONVERSATION_CACHE.keys())}")
        
        if should_respond:
            text = event.get("text", "").strip()
            channel_id = event.get("channel")
            user_id = event.get("user")
            
            # Skip bot's own messages
            try:
                bot_user_id = web_client.auth_test()["user_id"]
                if user_id == bot_user_id:
                    return
            except Exception as e:
                logger.warning(f"Failed to check bot user ID: {e}")
                return
            
            # Extract timestamps for conversation management
            thread_ts = event.get("thread_ts")
            message_ts = event.get("ts")
            
            logger.info(f"Received {event_type} from user {user_id} in channel {channel_id}")
            
            # Process text based on event type
            if event_type == "app_mention":
                # Remove the bot's mention from the text (e.g., "<@U123456> question" -> "question")
                user_question = text.split(">", 1)[-1].strip()
            else:
                # For thread messages, use the text as-is (but remove mention if present)
                if f"<@{bot_user_id}>" in text:
                    user_question = text.replace(f"<@{bot_user_id}>", "").strip()
                else:
                    user_question = text
            
            # Determine conversation ID and retrieve history
            if thread_ts:
                # Follow-up question in existing thread
                conversation_id = thread_ts
                history = CONVERSATION_CACHE.get(conversation_id)
                logger.info(f"Continuing conversation {conversation_id} with history: {bool(history)}")
            else:
                # New question in main channel - start new thread
                conversation_id = message_ts
                history = None
                logger.info(f"Starting new conversation {conversation_id}")
            
            logger.info(f"💾 Using conversation_id: '{conversation_id}', thread_ts: '{thread_ts}', message_ts: '{message_ts}'")
            
            # Check circuit breaker before processing
            if circuit_breaker.is_open():
                logger.warning("Circuit breaker is OPEN - sending agent down message")
                send_error_message(channel_id, conversation_id, "agent_down")
                return
            
            # Send thinking indicator in thread
            try:
                web_client.chat_postMessage(
                    channel=channel_id,
                    thread_ts=conversation_id,
                    text="🤔 Let me explore the available data and answer your question..."
                )
            except Exception as e:
                logger.warning(f"Failed to send thinking indicator: {e}")

            # Process the question with enhanced error handling
            try:
                success, response_text, final_history = malloy_agent.process_user_question(user_question, history=history)
                
                if success:
                    circuit_breaker.record_success()
                    service_health.mcp_server = True
                    logger.info(f"Successfully processed question for user {user_id}")
                    
                    logger.debug(f"Response from agent: '{response_text}'")
                    logger.debug(f"Response length: {len(response_text)}")
                    logger.debug(f"Response type: {type(response_text)}")

                    # Sanitize the response to handle markdown ```json ... ```
                    clean_response_text = _strip_markdown_json(response_text)

                    try:
                        response_data = json.loads(clean_response_text)
                        # Check for chart URL (new QuickChart approach)
                        if "chart_url" in response_data and response_data.get("status") == "success":
                            chart_url = response_data["chart_url"]
                            chart_text = response_data.get("text", "Here's your chart:")
                            
                            try:
                                # Send chart URL as a message - Slack will automatically display it as an image
                                web_client.chat_postMessage(
                                    channel=channel_id,
                                    thread_ts=conversation_id,
                                    text=f"{chart_text}\n{chart_url}",
                                    unfurl_links=True,  # Allow Slack to unfurl the chart image
                                    unfurl_media=True
                                )
                                logger.info(f"Successfully shared chart URL for user {user_id}: {chart_url}")
                                
                            except Exception as e:
                                logger.error(f"Failed to send chart URL: {e}")
                                web_client.chat_postMessage(
                                    channel=channel_id,
                                    thread_ts=conversation_id,
                                    text=f"I created a chart but failed to share it: {e}"
                                )
                        else:
                            # It's JSON, but not a chart, so send the text part
                            web_client.chat_postMessage(
                                channel=channel_id,
                                thread_ts=conversation_id,
                                text=response_data.get("text", clean_response_text)
                            )
                            
                    except json.JSONDecodeError:
                        logger.debug(f"Not JSON, treating as text response: '{response_text}'")
                        
                        if not response_text or response_text.strip() == "":
                            response_text = "I'm sorry, I couldn't generate a proper response."
                        
                        web_client.chat_postMessage(
                            channel=channel_id,
                            thread_ts=conversation_id,
                            text=response_text
                        )
                    
                    # Update conversation cache with final history
                    if final_history:
                        CONVERSATION_CACHE[conversation_id] = final_history
                        logger.info(f"💾 Updated conversation cache for {conversation_id}")
                        logger.info(f"💾 Cache now has keys: {list(CONVERSATION_CACHE.keys())}")
                        
                        # Clean up old conversations periodically
                        cleanup_old_conversations()
                    else:
                        logger.info(f"💾 No final_history to store for {conversation_id}")
                    
                else:
                    # Failed to process - could be MCP server issue
                    circuit_breaker.record_failure()
                    service_health.mcp_server = False
                    logger.warning(f"Failed to process question for user {user_id}: {response_text}")
                    
                    # Check if this looks like an MCP connection error
                    if "connection" in response_text.lower() or "timeout" in response_text.lower():
                        send_error_message(channel_id, conversation_id, "connection_error")
                    else:
                        send_error_message(channel_id, conversation_id, "processing_error", response_text)
                    
                    # Still update cache even for failed responses to maintain context
                    if final_history:
                        CONVERSATION_CACHE[conversation_id] = final_history
                        logger.info(f"💾 Updated conversation cache for FAILED response {conversation_id}")
                    else:
                        logger.info(f"💾 No final_history to store for FAILED response {conversation_id}")
                        
            except Exception as e:
                circuit_breaker.record_failure()
                service_health.mcp_server = False
                logger.error(f"Exception processing question for user {user_id}: {e}")
                send_error_message(channel_id, conversation_id, "processing_error", str(e))

def reconnect_socket_client():
    """Attempt to restore Slack Socket Mode connection with exponential backoff
    
    Implements retry logic with increasing delays between attempts to handle
    temporary network issues or Slack service disruptions.
    
    Returns:
        bool: True if reconnection successful, False if all attempts failed
    """
    global socket_mode_client
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to reconnect Socket Mode client (attempt {attempt + 1}/{max_retries})")
            
            if socket_mode_client:
                try:
                    socket_mode_client.disconnect()
                except:
                    pass
            
            # Reinitialize and reconnect
            socket_mode_client.connect()
            logger.info("✅ Socket Mode client reconnected successfully")
            return True
            
        except Exception as e:
            logger.error(f"Reconnection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(10 * (attempt + 1))  # Exponential backoff
    
    logger.error("❌ Failed to reconnect Socket Mode client after all attempts")
    return False

# --- Main Execution ---

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()
    
    logger.info("🤖 Enhanced Malloy Bot is starting...")
    
    # Parse command line arguments only when running as main
    args = parse_args()
    
    try:
        # Initialize bot with command line arguments
        init_bot(model=args.model, provider=args.provider)
        
        # Connect Socket Mode client with retry logic
        try:
            socket_mode_client.socket_mode_request_listeners.append(process_slack_events)
            socket_mode_client.connect()
            logger.info("✅ Bot connected and listening for events")
            
            # Keep the main thread alive with reconnection logic
            while True:
                try:
                    if shutdown_event.wait(30):  # Check every 30 seconds
                        break
                        
                    # Check if socket client is still connected
                    if socket_mode_client and not socket_mode_client.is_connected():
                        logger.warning("Socket Mode client disconnected - attempting reconnection")
                        if not reconnect_socket_client():
                            logger.critical("Failed to reconnect - service may be degraded")
                        
                except KeyboardInterrupt:
                    logger.info("Received shutdown signal")
                    break
                except Exception as e:
                    logger.error(f"Error in main loop: {e}")
                    time.sleep(10)
            
        except Exception as e:
            logger.error(f"❌ Failed to connect Socket Mode client: {e}")
            raise
        
    except Exception as e:
        logger.error(f"❌ Bot failed to start: {e}")
        raise
    finally:
        # Cleanup
        shutdown_event.set()
        logger.info("🛑 Bot shutting down")