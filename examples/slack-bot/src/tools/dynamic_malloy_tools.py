"""
Dynamic Malloy Tools Factory
Creates LangChain tools from MCP server tools and adds chart generation
"""

import json
from typing import List, Dict, Any, Optional
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from ..clients.enhanced_mcp_client import EnhancedMCPClient

# Import the QuickChart tool instead of matplotlib
try:
    from ..tools.quickchart_tool import QuickChartTool
except ImportError:
    try:
        from src.tools.quickchart_tool import QuickChartTool
    except ImportError:
        QuickChartTool = None


class DynamicMalloyTool(BaseTool):
    """A dynamically created tool from MCP server capabilities"""
    
    name: str
    description: str
    mcp_client: EnhancedMCPClient
    tool_name: str
    input_schema: Optional[Dict[str, Any]] = None
    
    class Config:
        arbitrary_types_allowed = True
    
    def __init__(self, mcp_client: EnhancedMCPClient, tool_name: str, tool_info: Dict[str, Any], **kwargs):
        # Extract description and input schema from tool info
        description = tool_info.get('description', f'Execute {tool_name} tool')
        input_schema = tool_info.get('inputSchema', {})
        
        super().__init__(
            name=tool_name,
            description=description,
            mcp_client=mcp_client,
            tool_name=tool_name,
            input_schema=input_schema,
            **kwargs
        )
    
    def _create_dynamic_args_schema(self) -> type[BaseModel]:
        """Create a dynamic Pydantic model based on the tool's input schema"""
        if not self.input_schema or 'properties' not in self.input_schema:
            # Create a generic schema that accepts any keyword arguments
            class GenericArgs(BaseModel):
                class Config:
                    extra = "allow"
            return GenericArgs
        
        # Create fields based on the JSON schema
        fields = {}
        properties = self.input_schema.get('properties', {})
        required = self.input_schema.get('required', [])
        
        for prop_name, prop_info in properties.items():
            field_type = str  # Default to string
            description = prop_info.get('description', f'{prop_name} parameter')
            default = ... if prop_name in required else None
            
            fields[prop_name] = (field_type, Field(default=default, description=description))
        
        # Dynamically create the Pydantic model
        return type(f"{self.tool_name}Args", (BaseModel,), {"__annotations__": dict((k, v[0]) for k, v in fields.items()),
                                                            **dict((k, v[1]) for k, v in fields.items())})
    
    @property
    def args_schema(self) -> type[BaseModel]:
        """Return the dynamically created args schema"""
        return self._create_dynamic_args_schema()

    async def _arun(self, **kwargs: Any) -> str:
        """Execute the tool via MCP client (async)"""
        try:
            async with self.mcp_client as client:
                result = await client.call_tool(self.tool_name, **kwargs)
                if isinstance(result, dict):
                    return json.dumps(result)
                return str(result)
        except Exception as e:
            error_msg = f"Error calling {self.tool_name}: {str(e)}"
            print(f"🔍 DEBUG: {error_msg}")
            return error_msg

    def _run(self, **kwargs: Any) -> str:
        """Execute the tool via MCP client (sync fallback)"""
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self._arun(**kwargs))
        except Exception as e:
            error_msg = f"Error calling {self.tool_name}: {str(e)}"
            print(f"🔍 DEBUG: {error_msg}")
            return error_msg


class MalloyToolsFactory:
    """Factory for creating LangChain tools from MCP server capabilities"""
    
    def __init__(self, mcp_client: EnhancedMCPClient):
        self.mcp_client = mcp_client

    async def create_tools(self) -> List[BaseTool]:
        """Create LangChain tools from MCP server tools"""
        try:
            # Use async context manager for MCP client and discover tools
            async with self.mcp_client as client:
                tools_info = await client.discover_tools()
                langchain_tools = []
                
                # Create LangChain tools from MCP tools
                for tool_name, tool_info in tools_info.items():
                    try:
                        dynamic_tool = DynamicMalloyTool(
                            mcp_client=self.mcp_client,
                            tool_name=tool_name,
                            tool_info=tool_info
                        )
                        langchain_tools.append(dynamic_tool)
                        print(f"Created tool: {tool_name}")
                    except Exception as e:
                        print(f"Failed to create tool {tool_name}: {e}")
                        continue
                
                # Always add the QuickChart tool for chart generation
                try:
                    if QuickChartTool is not None:
                        quickchart_tool = QuickChartTool()
                        langchain_tools.append(quickchart_tool)
                        print(f"Added QuickChart tool for chart generation")
                    else:
                        print("Warning: QuickChart tool not available - quickchart.io library may not be installed")
                except Exception as e:
                    print(f"Warning: Failed to add QuickChart tool: {e}")

                print(f"Created {len(langchain_tools)} total tools")
                return langchain_tools
            
        except Exception as e:
            print(f"Error creating tools: {e}")
            return []

    def create_tools_sync(self) -> List[BaseTool]:
        """Synchronous wrapper for create_tools"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.create_tools())
        except RuntimeError:
            # If no event loop is running, create a new one
            return asyncio.run(self.create_tools())