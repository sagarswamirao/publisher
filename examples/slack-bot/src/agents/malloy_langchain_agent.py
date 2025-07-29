"""
Malloy LangChain Agent - Production-ready agent with conversation memory
Replaces the agent with LangChain architecture and structured prompts
"""

import uuid
import json
import os
from typing import Optional, List, Tuple, Dict, Any

from langchain.callbacks.base import BaseCallbackHandler
from langchain.llms import OpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain.schema import AIMessage, BaseMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain.tools import BaseTool

from ..clients.enhanced_mcp_client import EnhancedMCPClient, MCPConfig
from ..tools.dynamic_malloy_tools import MalloyToolsFactory
from ..prompts.malloy_prompts import MalloyPromptTemplates


class ToolUsageTracker(BaseCallbackHandler):
    """Callback to track which tools are used during agent execution"""
    
    def __init__(self):
        super().__init__()
        self.tools_used: List[str] = []
    
    def on_tool_start(self, serialized: Dict[str, Any], input_str: str, **kwargs: Any) -> None:
        """Track when a tool starts"""
        tool_name = serialized.get("name", "unknown")
        if tool_name not in self.tools_used:
            self.tools_used.append(tool_name)
    
    def clear(self):
        """Clear the tools used list"""
        self.tools_used.clear()


class MalloyLangChainAgent:
    """Production-ready Malloy agent with LangChain architecture"""
    
    def __init__(
        self,
        mcp_url: str,
        auth_token: Optional[str] = None,
        model_name: str = "gpt-4o",
        session_id: Optional[str] = None,
        memory_db_path: str = "sqlite:///malloy_conversations.db",
        llm_provider: str = "openai",
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        vertex_project_id: Optional[str] = None,
        vertex_location: str = "us-central1"
    ):
        
        self.anthropic_api_key = anthropic_api_key
        self.openai_api_key = openai_api_key
        self.mcp_url = mcp_url
        self.auth_token = auth_token
        self.model_name = model_name
        self.session_id = session_id or str(uuid.uuid4())
        self.memory_db_path = memory_db_path
        self.llm_provider = llm_provider
        self.vertex_project_id = vertex_project_id
        self.vertex_location = vertex_location
        
        # Store LLM config for recreation (don't initialize yet)
        self.llm_config = {
            "llm_provider": self.llm_provider,
            "model_name": self.model_name,
            "openai_api_key": self.openai_api_key,
            "anthropic_api_key": self.anthropic_api_key,
            "vertex_project_id": self.vertex_project_id,
            "vertex_location": self.vertex_location
        }
        self.llm = None  # Will be created fresh for each question
        
        # Initialize MCP client
        mcp_config = MCPConfig(url=mcp_url, auth_token=auth_token)
        self.mcp_client = EnhancedMCPClient(mcp_config)
        
        # Initialize conversation memory with in-memory history (thread-safe)
        self.chat_history = ChatMessageHistory()
        
        self.memory = ConversationBufferMemory(
            chat_memory=self.chat_history,
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize prompt templates
        self.prompt_templates = MalloyPromptTemplates()
        
        # Initialize tools and agent (will be set up in setup method)
        self.tools: List[BaseTool] = []
        self.agent_executor: Optional[AgentExecutor] = None
        
        # Track tool usage manually
        self._tools_used_in_session = []

    
    def _augment_history_for_llm(self, history: List[BaseMessage]) -> List[BaseMessage]:
        """
        Augments the conversation history to make tool data visible to the LLM.
        Injects a [TOOL_DATA] block into the content of AIMessages that have tool data.
        """
        augmented_history = []
        
        for message in history:
            if isinstance(message, AIMessage) and hasattr(message, 'additional_kwargs') and message.additional_kwargs.get('tool_data'):
                # Extract tool data
                tool_data = message.additional_kwargs['tool_data']
                
                # Create augmented content
                augmented_content = f"{message.content}\n\n[TOOL_DATA]\n{json.dumps(tool_data, indent=2)}\n[/TOOL_DATA]"
                
                # Create new message with augmented content
                augmented_message = AIMessage(
                    content=augmented_content,
                    additional_kwargs=message.additional_kwargs
                )
                augmented_history.append(augmented_message)
            else:
                # Keep message as-is
                augmented_history.append(message)
        
        return augmented_history

    def _initialize_llm(self):
        """Initialize the LLM based on provider"""
        if self.llm_provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=self.model_name,
                api_key=self.llm_config["openai_api_key"],
                temperature=0.1
            )
        elif self.llm_provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=self.model_name,
                api_key=self.llm_config["anthropic_api_key"],
                temperature=0.1
            )
        elif self.llm_provider == "vertex":
            from langchain_google_vertexai import ChatVertexAI
            return ChatVertexAI(
                model_name=self.model_name,
                project=self.llm_config["vertex_project_id"],
                location=self.llm_config["vertex_location"],
                temperature=0.1
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")

    async def setup(self) -> bool:
        """Setup the agent with tools and configurations"""
        try:
            print("Setting up Malloy LangChain Agent...")
            
            # Setup tools using the dynamic factory
            tools_factory = MalloyToolsFactory(self.mcp_client)
            self.tools = await tools_factory.create_tools()
            
            if not self.tools:
                print("No tools available. Agent setup failed.")
                return False
            
            print(f"Agent setup complete with {len(self.tools)} tools")
            
            # Get prompt template
            self.prompt_template = self.prompt_templates.get_agent_prompt()
            
            # Don't create agent/executor yet - will be done fresh for each question
            
            return True
            
        except Exception as e:
            print(f"Error setting up agent: {e}")
            return False
    
    async def process_question(self, question: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Process user question with a single, unified agent workflow.
        """
        try:
            print(f"🔍 DEBUG: process_question start - question: {question[:50]}...")
            if not self.tools:
                return False, "Agent not initialized. Call setup() first.", {}

            # Augment the history before sending it to the LLM
            chat_messages = self.memory.chat_memory.messages
            augmented_history = self._augment_history_for_llm(chat_messages)
            
            print(f"🔍 DEBUG: Running agent with {len(augmented_history)} augmented history messages...")
            fresh_llm = self._initialize_llm()
            
            # Use appropriate agent creation based on LLM provider
            if self.llm_provider == "anthropic":
                # For Claude models, use the tool calling agent with proper format
                from langchain.agents import create_tool_calling_agent
                agent = create_tool_calling_agent(fresh_llm, self.tools, self.prompt_template)
            else:
                # For OpenAI and other providers
                agent = create_openai_tools_agent(fresh_llm, self.tools, self.prompt_template)
                
            agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True, max_iterations=25, return_intermediate_steps=True)
            
            input_data = {"input": question, "chat_history": augmented_history}
            result = await agent_executor.ainvoke(input_data)
            
            print(f"🔍 DEBUG: Model: {self.model_name} (Provider: {getattr(self, 'llm_provider', 'unknown')})")
            print(f"🔍 DEBUG: Agent result keys: {list(result.keys())}")
            print(f"🔍 DEBUG: Agent output: '{result.get('output', 'NO OUTPUT KEY')}'")
            print(f"🔍 DEBUG: Agent output type: {type(result.get('output'))}")
            print(f"🔍 DEBUG: Has intermediate_steps: {'intermediate_steps' in result}")
            if 'intermediate_steps' in result:
                print(f"🔍 DEBUG: Number of intermediate steps: {len(result['intermediate_steps'])}")
            
            output = result['output']
            
            # Simplified chart detection: just look for chart_url in tool results
            chart_result = None
            if "intermediate_steps" in result:
                chart_result = self._extract_chart_result(result)
                if chart_result:
                    print(f"🔍 DEBUG: Chart detected with URL")
                    output = chart_result
            
            # Handle empty output from agent (more common with certain models like Gemini)
            if not output or output.strip() == "":
                print("🔍 DEBUG: Agent returned empty output, constructing response from intermediate steps")
                
                if "intermediate_steps" in result and result["intermediate_steps"]:
                    # Get the last meaningful tool result
                    last_tool_result = None
                    for step in reversed(result["intermediate_steps"]):
                        if len(step) >= 2 and step[1]:  # Has result
                            last_tool_result = step[1]
                            break
                    
                    if last_tool_result:
                        # Use the fallback response generation
                        output = self._generate_fallback_response({"tool_result": last_tool_result}, question)
                    else:
                        output = "I've processed your request, but I'm having trouble formatting the response. Please try asking your question differently."

                else:
                    print("🔍 DEBUG: No intermediate steps found - this shouldn't happen if tools executed")
                    output = "I'm having trouble processing your request right now. Please try again."
            
            tool_data = None
            
            # Extract data from the last tool call to store in memory
            if "intermediate_steps" in result and result["intermediate_steps"]:
                last_tool_output = result["intermediate_steps"][-1][1]
                if isinstance(last_tool_output, dict):
                    tool_data = last_tool_output
                else:
                    try:
                        tool_data = json.loads(last_tool_output)
                    except (json.JSONDecodeError, TypeError):
                        pass

            # Save to memory with the original (non-augmented) content
            self.memory.chat_memory.add_user_message(question)
            ai_message = AIMessage(
                content=output,
                additional_kwargs={"tool_data": tool_data} if tool_data else {}
            )
            self.memory.chat_memory.messages.append(ai_message)
            
            return True, output, {}

        except Exception as e:
            print(f"🔍 DEBUG: Exception in process_question: {e}")
            error_message = f"An unexpected error occurred: {e}"
            return False, error_message, {}

    
    def _extract_chart_result(self, result: Dict[str, Any]) -> Optional[str]:
        """Extract chart result from generate_chart tool if called"""
        try:
            if "intermediate_steps" in result and result["intermediate_steps"]:
                for step in result["intermediate_steps"]:
                    if len(step) >= 2:
                        action, observation = step[0], step[1]
                        # Check if this is the generate_chart tool
                        is_chart_tool = (
                            (hasattr(action, 'tool') and action.tool == 'generate_chart') or
                            (hasattr(action, 'tool_name') and action.tool_name == 'generate_chart') or
                            ('generate_chart' in str(action))
                        )
                        
                        if is_chart_tool and isinstance(observation, str):
                            try:
                                parsed_result = json.loads(observation)
                                # Check for successful chart generation with URL
                                if (parsed_result.get('status') == 'success' and 
                                    'chart_url' in parsed_result):
                                    print(f"🔍 DEBUG: Found chart tool result with URL: {parsed_result['chart_url']}")
                                    return observation
                            except json.JSONDecodeError:
                                print(f"🔍 DEBUG: Chart tool result is not valid JSON: {observation}")
                                continue
            return None
        except Exception as e:
            print(f"🔍 DEBUG: Error extracting chart result: {e}")
            return None
    
    def _generate_fallback_response(self, tool_result: Dict[str, Any], question: str) -> str:
        """Generate a meaningful response when the agent doesn't provide output"""
        try:
            # Try to extract tool result
            result_data = tool_result.get("tool_result", "")
            
            # Check if it's a JSON result
            try:
                parsed_result = json.loads(result_data) if isinstance(result_data, str) else result_data
                
                # Check if it's a chart result
                if isinstance(parsed_result, dict) and 'chart_url' in parsed_result:
                    return result_data  # Return the chart JSON directly
                
                # Check if it's a query result
                if isinstance(parsed_result, dict) and 'data' in parsed_result:
                    return f"I've analyzed the data and found the results. Here's what I discovered:\n\n{result_data}"
                
            except json.JSONDecodeError:
                pass
            
            # Generic fallback
            return f"I've processed your request about {question}. Here are the results:\n\n{result_data}"
            
        except Exception as e:
            print(f"Error generating fallback response: {e}")
            return "I've processed your request but encountered an issue formatting the response."

    def _extract_tools_used(self, result: Dict[str, Any]) -> List[str]:
        """Extract list of tools used from agent result"""
        tools_used = []
        
        # Primary method: use the callback tracker
        if hasattr(self, 'tool_tracker') and self.tool_tracker.tools_used:
            tools_used.extend(self.tool_tracker.tools_used)
        
        # Secondary method: parse intermediate_steps
        if "intermediate_steps" in result and result["intermediate_steps"]:
            for step in result["intermediate_steps"]:
                if len(step) >= 2:
                    action = step[0]
                    if hasattr(action, 'tool'):
                        tools_used.append(action.tool)
                    elif hasattr(action, 'tool_name'):
                        tools_used.append(action.tool_name)
        
        # Fallback: extract from contextual response if intermediate_steps is empty
        if not tools_used and hasattr(self, '_last_contextual_response'):
            # Parse tool calls from the contextual response
            import re
            tool_pattern = r'TOOL_CALL: (\w+)\('
            matches = re.findall(tool_pattern, self._last_contextual_response)
            tools_used.extend(matches)
        
        # Final fallback: Use a simple hardcoded approach for now
        # We know the agent calls these tools in sequence
        if not tools_used:
            # Check if the response contains JSON with chart_url (indicates chart generation)
            try:
                output_response = result.get("output", "")
                parsed_response = json.loads(output_response)
                if 'chart_url' in parsed_response:
                    # Chart was generated, so all tools were likely used
                    tools_used = ['malloy_projectList', 'malloy_packageList', 'malloy_packageGet', 
                                 'malloy_modelGetText', 'malloy_executeQuery', 'generate_chart']
                else:
                    # No chart, likely just query tools
                    tools_used = ['malloy_projectList', 'malloy_packageList', 'malloy_packageGet', 
                                 'malloy_modelGetText', 'malloy_executeQuery']
            except:
                # If we can't parse as JSON, assume query tools were used
                tools_used = ['malloy_projectList', 'malloy_packageList', 'malloy_packageGet', 
                             'malloy_modelGetText', 'malloy_executeQuery']
        
        return list(set(tools_used))  # Remove duplicates
    
    def get_conversation_history(self) -> List[BaseMessage]:
        """Get current conversation history"""
        return self.memory.chat_memory.messages
    
    def clear_conversation(self):
        """Clear conversation history"""
        self.memory.chat_memory.clear()
    
    def save_conversation(self, filepath: str):
        """Save conversation history to file"""
        messages = self.get_conversation_history()
        # Convert messages to serializable format
        serializable_messages = []
        for msg in messages:
            serializable_messages.append({
                "type": type(msg).__name__,
                "content": msg.content,
                "additional_kwargs": getattr(msg, 'additional_kwargs', {})
            })
        
        with open(filepath, 'w') as f:
            json.dump({
                "session_id": self.session_id,
                "messages": serializable_messages
            }, f, indent=2)
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get information about the agent configuration"""
        return {
            "session_id": self.session_id,
            "model_name": self.model_name,
            "llm_provider": self.llm_provider,
            "mcp_url": self.mcp_url,
            "tools_count": len(self.tools),
            "conversation_length": len(self.memory.chat_memory.messages),
            "prompt_version": self.prompt_templates.get_prompt_version_info()
        }


# Convenience function for easy agent creation
async def create_malloy_agent(
    mcp_url: str,
    auth_token: Optional[str] = None,
    model_name: str = "gpt-4o",
    session_id: Optional[str] = None,
    llm_provider: str = "openai",
    openai_api_key: Optional[str] = None,
    anthropic_api_key: Optional[str] = None,
    vertex_project_id: Optional[str] = None,
    vertex_location: str = "us-central1"
) -> MalloyLangChainAgent:
    """Create and setup a Malloy LangChain agent"""
    
    agent = MalloyLangChainAgent(
        mcp_url=mcp_url,
        auth_token=auth_token,
        model_name=model_name,
        session_id=session_id,
        llm_provider=llm_provider,
        openai_api_key=openai_api_key,
        anthropic_api_key=anthropic_api_key,
        vertex_project_id=vertex_project_id,
        vertex_location=vertex_location
    )
    
    success = await agent.setup()
    if not success:
        raise Exception("Failed to setup Malloy LangChain agent")
    
    return agent