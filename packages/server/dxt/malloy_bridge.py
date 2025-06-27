#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.parse
import logging
import time
import signal
from typing import Dict, Any, Optional

# Set up logging with more detailed format
logging.basicConfig(
    filename='/tmp/malloy_bridge.log', 
    level=logging.DEBUG, 
    format='%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
)

class ImprovedMalloyMCPBridge:
    def __init__(self):
        self.mcp_url = "http://localhost:4040/mcp"
        # Mapping of Claude-compatible names to original names
        # Reverse mapping for responses
        self.reverse_tool_mapping = {v: k for k, v in self.tool_name_mapping.items()}
        
        # Set stdin/stdout to line buffered mode for better responsiveness
        sys.stdin.reconfigure(line_buffering=True)
        sys.stdout.reconfigure(line_buffering=True)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
        logging.info("Bridge initialized with improved stdio handling")
    
    def signal_handler(self, signum, frame):
        logging.info(f"Received signal {signum}, shutting down gracefully")
        sys.exit(0)
            
    def parse_sse_response(self, response_text: str, request_id: Optional[Any] = None) -> Dict[str, Any]:
        """Parse Server-Sent Events response format with improved error handling"""
        lines = response_text.strip().split('\n')
        data_line = None
        
        # Look for data line in SSE format
        for line in lines:
            if line.startswith('data: '):
                data_line = line[6:]  # Remove 'data: ' prefix
                break
        
        # If no SSE format, try parsing the entire response as JSON
        if not data_line:
            data_line = response_text.strip()
        
        if data_line:
            try:
                parsed_data = json.loads(data_line)
                # Ensure the response has a proper ID
                if 'id' not in parsed_data or parsed_data['id'] is None:
                    parsed_data['id'] = request_id
                
                logging.debug(f"Successfully parsed response for request {request_id}")
                return parsed_data
                
            except json.JSONDecodeError as e:
                logging.error(f"JSON decode error for request {request_id}: {e}")
                return {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32603,
                        "message": f"Failed to parse response: {str(e)}"
                    },
                    "id": request_id
                }
        else:
            logging.error(f"No data found in response for request {request_id}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": "No data found in response"
                },
                "id": request_id
            }
    
    def send_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Send a JSON-RPC request to the Malloy MCP endpoint with improved timeout handling"""
        request_id = request.get("id")
        method = request.get("method", "unknown")
        start_time = time.time()
        
        logging.debug(f"Sending request {request_id} ({method}) to Malloy server")
        
        try:
            # Ensure the request has proper structure
            if "jsonrpc" not in request:
                request["jsonrpc"] = "2.0"
                        
            # Prepare the request with shorter timeout for responsiveness
            data = json.dumps(request).encode('utf-8')
            req = urllib.request.Request(
                self.mcp_url,
                data=data,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'Connection': 'close'  # Don't keep connections open
                }
            )
            
            with urllib.request.urlopen(req, timeout=60) as response:
                response_text = response.read().decode('utf-8')
                parsed_response = self.parse_sse_response(response_text, request_id)
                
                elapsed = time.time() - start_time
                logging.debug(f"Request {request_id} completed in {elapsed:.2f}s")
                return parsed_response
                
        except urllib.error.HTTPError as e:
            elapsed = time.time() - start_time
            error_message = f"HTTP {e.code}: {e.reason}"
            try:
                error_body = e.read().decode('utf-8')
                error_message += f" - {error_body}"
            except:
                pass
            
            logging.error(f"HTTP error for request {request_id} after {elapsed:.2f}s: {error_message}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": e.code,
                    "message": error_message
                },
                "id": request_id
            }
            
        except urllib.error.URLError as e:
            elapsed = time.time() - start_time
            error_msg = f"Connection error: {str(e)}"
            logging.error(f"URL error for request {request_id} after {elapsed:.2f}s: {error_msg}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": error_msg
                },
                "id": request_id
            }
            
        except Exception as e:
            elapsed = time.time() - start_time
            error_msg = f"Unexpected error: {str(e)}"
            logging.error(f"Unexpected error for request {request_id} after {elapsed:.2f}s: {error_msg}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": error_msg
                },
                "id": request_id
            }
    
    def safe_print(self, data):
        """Print with improved error handling and immediate flushing"""
        try:
            output = json.dumps(data)
            print(output)
            sys.stdout.flush()  # Force immediate flush
            logging.debug(f"Successfully sent response: {len(output)} chars")
            
        except BrokenPipeError:
            logging.error("Broken pipe error - client disconnected")
            sys.exit(0)
            
        except Exception as e:
            logging.error(f"Print error: {e}")
            # Don't exit on print errors, just log them
    
    def process_request(self, line: str) -> None:
        """Process a single request line with improved error handling"""
        try:
            request = json.loads(line)
            request_id = request.get("id", "unknown")
            method = request.get("method", "unknown")
            
            logging.debug(f"Processing request {request_id}: {method}")
            
            # Validate required fields
            if not isinstance(request, dict):
                raise ValueError("Request must be a JSON object")
            
            if "method" not in request:
                raise ValueError("Request must have a 'method' field")
            
            # Ensure ID is present and valid
            if "id" not in request:
                request["id"] = 1  # Default ID
            elif request["id"] is None:
                request["id"] = 1  # Replace null with default
            
            # Send request and get response
            response = self.send_request(request)
            
            # Send response immediately
            self.safe_print(response)
            
        except json.JSONDecodeError as e:
            logging.error(f"JSON parse error: {e}")
            error_response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32700,
                    "message": f"Parse error: {str(e)}"
                },
                "id": None
            }
            self.safe_print(error_response)
            
        except ValueError as e:
            logging.error(f"Request validation error: {e}")
            error_response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32600,
                    "message": f"Invalid Request: {str(e)}"
                },
                "id": None
            }
            self.safe_print(error_response)
            
        except Exception as e:
            logging.error(f"Unexpected error processing request: {e}")
            error_response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                },
                "id": None
            }
            self.safe_print(error_response)
    
    def run(self):
        """Main loop with improved stdin handling"""
        logging.info("Starting main processing loop")
        
        try:
            # Process stdin line by line with immediate handling
            for line in sys.stdin:
                line = line.strip()
                if not line:
                    continue
                
                # Process each request immediately
                self.process_request(line)
                
        except KeyboardInterrupt:
            logging.info("Received keyboard interrupt, shutting down")
            sys.exit(0)
            
        except BrokenPipeError:
            logging.info("Broken pipe detected, client disconnected")
            sys.exit(0)
            
        except Exception as e:
            logging.error(f"Fatal error in main loop: {e}")
            sys.exit(1)
        
        logging.info("Main loop completed")

if __name__ == "__main__":
    try:
        bridge = ImprovedMalloyMCPBridge()
        bridge.run()
    except Exception as e:
        logging.error(f"Failed to start bridge: {e}")
        sys.exit(1)