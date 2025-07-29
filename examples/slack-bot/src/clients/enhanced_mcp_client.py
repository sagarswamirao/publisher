"""
Enhanced MCP Client for Malloy Publisher - Simplified SDK Integration
- Uses official MCP ClientSession and streamablehttp_client  
- No authentication (suitable for localhost development)
- Maintains backward compatibility with existing interface
- Built-in retry logic and proper error handling from SDK
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, AsyncGenerator, Union

from mcp import ClientSession, types
from mcp.client.streamable_http import streamablehttp_client
from pydantic import AnyUrl

logger = logging.getLogger(__name__)

@dataclass
class MCPConfig:
    """Configuration for MCP client"""
    url: str
    auth_token: Optional[str] = None  # Kept for backward compatibility, but not used
    timeout: int = 30
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0

class MCPError(Exception):
    """Base exception for MCP client errors"""
    pass

class MCPConnectionError(MCPError):
    """Raised when connection to MCP server fails"""
    pass

class MCPAuthError(MCPError):
    """Raised when authentication fails"""
    pass

class MCPTimeoutError(MCPError):
    """Raised when request times out"""
    pass

class EnhancedMCPClient:
    """
    Enhanced MCP client using official MCP Python SDK
    Simplified for localhost development without authentication
    """
    
    def __init__(self, config: MCPConfig):
        self.config = config
        self.session: Optional[ClientSession] = None
        self.available_tools: Dict[str, Any] = {}
        self._client_streams = None
    
    async def __aenter__(self) -> 'EnhancedMCPClient':
        """Async context manager entry"""
        await self._create_session()
        await self.discover_tools()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def _create_session(self):
        """Create MCP session using official SDK"""
        try:
            # Determine the MCP endpoint URL
            mcp_url = self.config.url
            if not mcp_url.endswith('/mcp'):
                mcp_url = f"{mcp_url}/mcp"
            
            # Create streamable HTTP client (no auth for localhost)
            self._client_streams = await streamablehttp_client(mcp_url).__aenter__()
            read_stream, write_stream, _ = self._client_streams
            
            # Create session
            self.session = ClientSession(read_stream, write_stream)
            await self.session.__aenter__()
            
            # Initialize the connection
            await self.session.initialize()
            
            logger.info(f"Created MCP session for {mcp_url}")
            
        except Exception as e:
            logger.error(f"Failed to create MCP session: {e}")
            raise MCPConnectionError(f"Failed to connect to MCP server: {e}")
    
    async def close(self):
        """Close the MCP session and streams"""
        try:
            if self.session:
                await self.session.__aexit__(None, None, None)
                self.session = None
            
            if self._client_streams:
                # The streamablehttp_client context manager handles cleanup
                pass
            
            logger.info("Closed MCP session")
        except Exception as e:
            logger.warning(f"Error during cleanup: {e}")
    
    async def discover_tools(self) -> Dict[str, Any]:
        """
        Discover available MCP tools using official SDK
        """
        if not self.session:
            raise MCPConnectionError("Session not initialized. Use async context manager.")
        
        logger.info("Discovering available MCP tools...")
        
        try:
            # Use SDK's list_tools method
            tools_response = await self.session.list_tools()
            
            # Convert to the expected format for backward compatibility
            self.available_tools = {
                tool.name: {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema
                }
                for tool in tools_response.tools
            }
            
            logger.info(f"Discovered {len(self.available_tools)} MCP tools: {list(self.available_tools.keys())}")
            return self.available_tools
            
        except Exception as e:
            logger.error(f"Failed to discover tools: {e}")
            self.available_tools = {}
            raise MCPError(f"Failed to discover tools: {e}")
    
    async def call_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any],
        stream: bool = False
    ) -> Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
        """
        Call a specific MCP tool using official SDK
        
        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool
            stream: Whether to use streaming response (not implemented in SDK yet)
            
        Returns:
            Tool response (dict) for compatibility
        """
        if not self.session:
            raise MCPConnectionError("Session not initialized. Use async context manager.")
        
        if tool_name not in self.available_tools:
            available = ", ".join(self.available_tools.keys())
            raise MCPError(f"Tool '{tool_name}' not available. Available tools: {available}")
        
        logger.debug(f"Calling MCP tool: {tool_name} with args: {arguments}")
        
        try:
            # Use SDK's call_tool method
            result = await self.session.call_tool(tool_name, arguments)
            
            # Convert result to backward-compatible format
            response = {
                "content": [],
                "isError": result.isError if hasattr(result, 'isError') else False
            }
            
            # Handle content - convert SDK types to dict format
            for content_item in result.content:
                if isinstance(content_item, types.TextContent):
                    response["content"].append({
                        "type": "text",
                        "text": content_item.text
                    })
                elif isinstance(content_item, types.ImageContent):
                    response["content"].append({
                        "type": "image",
                        "data": content_item.data,
                        "mimeType": content_item.mimeType
                    })
                else:
                    # Fallback for other content types
                    response["content"].append({
                        "type": "unknown",
                        "data": str(content_item)
                    })
            
            # Add structured content if available
            if hasattr(result, 'structuredContent') and result.structuredContent:
                response["structuredContent"] = result.structuredContent
            
            return response
            
        except Exception as e:
            logger.error(f"Tool call failed: {e}")
            raise MCPError(f"Tool '{tool_name}' failed: {e}")

    # Additional methods for enhanced functionality using SDK
    
    async def list_resources(self) -> List[Dict[str, Any]]:
        """List available resources using SDK"""
        if not self.session:
            raise MCPConnectionError("Session not initialized.")
        
        try:
            resources_response = await self.session.list_resources()
            return [
                {
                    "uri": str(resource.uri),
                    "name": resource.name,
                    "description": resource.description,
                    "mimeType": resource.mimeType
                }
                for resource in resources_response.resources
            ]
        except Exception as e:
            logger.error(f"Failed to list resources: {e}")
            return []
    
    async def read_resource(self, uri: str) -> Optional[Dict[str, Any]]:
        """Read a specific resource using SDK"""
        if not self.session:
            raise MCPConnectionError("Session not initialized.")
        
        try:
            resource_content = await self.session.read_resource(AnyUrl(uri))
            
            # Convert to dict format
            contents = []
            for content in resource_content.contents:
                if isinstance(content, types.TextContent):
                    contents.append({
                        "type": "text",
                        "text": content.text
                    })
                elif isinstance(content, types.BlobContent):
                    contents.append({
                        "type": "blob",
                        "data": content.data,
                        "mimeType": content.mimeType
                    })
            
            return {
                "uri": uri,
                "contents": contents
            }
            
        except Exception as e:
            logger.error(f"Failed to read resource {uri}: {e}")
            return None
    
    async def list_prompts(self) -> List[Dict[str, Any]]:
        """List available prompts using SDK"""
        if not self.session:
            raise MCPConnectionError("Session not initialized.")
        
        try:
            prompts_response = await self.session.list_prompts()
            return [
                {
                    "name": prompt.name,
                    "description": prompt.description,
                    "arguments": [
                        {
                            "name": arg.name,
                            "description": arg.description,
                            "required": arg.required
                        }
                        for arg in (prompt.arguments or [])
                    ]
                }
                for prompt in prompts_response.prompts
            ]
        except Exception as e:
            logger.error(f"Failed to list prompts: {e}")
            return []
    
    async def get_prompt(self, name: str, arguments: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        """Get a specific prompt using SDK"""
        if not self.session:
            raise MCPConnectionError("Session not initialized.")
        
        try:
            prompt_result = await self.session.get_prompt(name, arguments or {})
            
            return {
                "name": name,
                "description": prompt_result.description,
                "messages": [
                    {
                        "role": msg.role,
                        "content": msg.content.text if isinstance(msg.content, types.TextContent) else str(msg.content)
                    }
                    for msg in prompt_result.messages
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get prompt {name}: {e}")
            return None