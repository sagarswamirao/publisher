"""
Simple MCP Client following official SDK patterns.

This client follows the recommended patterns from the MCP Python SDK documentation,
creating new sessions per operation rather than trying to reuse them.
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


class SimpleMCPClient:
    """
    Simple MCP client that follows official SDK patterns.
    
    Creates new client sessions per operation as recommended by the MCP SDK.
    This avoids the async context management issues we were having with
    trying to reuse sessions across different async contexts.
    """
    
    def __init__(self, mcp_url: str):
        """Initialize with MCP server URL."""
        self.mcp_url = mcp_url
        self.logger = logging.getLogger(__name__)
        
        # Parse URL to validate
        parsed = urlparse(mcp_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError(f"Invalid MCP URL: {mcp_url}")
            
        self.logger.debug(f"SimpleMCPClient initialized for {mcp_url}")
    
    async def list_projects(self) -> List[Dict[str, Any]]:
        """List all available projects."""
        self.logger.debug("Listing projects")
        
        async with streamablehttp_client(self.mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Call the list projects tool
                result = await session.call_tool("malloy_projectList", {"random_string": "unused"})
                
                # Parse the result
                if result.content and len(result.content) > 0:
                    import json
                    try:
                        content = result.content[0]
                        if hasattr(content, 'text'):
                            data = json.loads(content.text)
                            return data.get('projects', [])
                    except (json.JSONDecodeError, AttributeError) as e:
                        self.logger.error(f"Error parsing projects result: {e}")
                        
                return []
    
    async def list_packages(self, project_name: str) -> List[Dict[str, Any]]:
        """List packages for a given project."""
        self.logger.debug(f"Listing packages for project: {project_name}")
        
        async with streamablehttp_client(self.mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                result = await session.call_tool("malloy_packageList", {"projectName": project_name})
                
                if result.content and len(result.content) > 0:
                    import json
                    try:
                        content = result.content[0]
                        if hasattr(content, 'text'):
                            data = json.loads(content.text)
                            return data.get('packages', [])
                    except (json.JSONDecodeError, AttributeError) as e:
                        self.logger.error(f"Error parsing packages result: {e}")
                        
                return []
    
    async def get_package(self, project_name: str, package_name: str) -> Dict[str, Any]:
        """Get package details including models."""
        self.logger.debug(f"Getting package: {project_name}/{package_name}")
        
        async with streamablehttp_client(self.mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                result = await session.call_tool("malloy_packageGet", {
                    "projectName": project_name,
                    "packageName": package_name
                })
                
                if result.content and len(result.content) > 0:
                    import json
                    try:
                        content = result.content[0]
                        if hasattr(content, 'text'):
                            return json.loads(content.text)
                    except (json.JSONDecodeError, AttributeError) as e:
                        self.logger.error(f"Error parsing package result: {e}")
                        
                return {}
    
    async def get_model_text(self, project_name: str, package_name: str, model_path: str) -> str:
        """Get the raw text content of a model file."""
        self.logger.debug(f"Getting model text: {project_name}/{package_name}/{model_path}")
        
        async with streamablehttp_client(self.mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                result = await session.call_tool("malloy_modelGetText", {
                    "projectName": project_name,
                    "packageName": package_name,
                    "modelPath": model_path
                })
                
                if result.content and len(result.content) > 0:
                    import json
                    try:
                        content = result.content[0]
                        if hasattr(content, 'text'):
                            data = json.loads(content.text)
                            return data.get('content', '')
                    except (json.JSONDecodeError, AttributeError) as e:
                        self.logger.error(f"Error parsing model text result: {e}")
                        
                return ""
    
    async def execute_query(
        self, 
        project_name: str, 
        package_name: str, 
        model_path: str, 
        query: Optional[str] = None,
        query_name: Optional[str] = None,
        source_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a Malloy query."""
        self.logger.debug(f"Executing query on {project_name}/{package_name}/{model_path}")
        
        async with streamablehttp_client(self.mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Prepare arguments
                args = {
                    "projectName": project_name,
                    "packageName": package_name,
                    "modelPath": model_path
                }
                
                if query:
                    args["query"] = query
                if query_name:
                    args["queryName"] = query_name
                if source_name:
                    args["sourceName"] = source_name
                
                result = await session.call_tool("malloy_executeQuery", args)
                
                if result.content and len(result.content) > 0:
                    import json
                    try:
                        content = result.content[0]
                        if hasattr(content, 'text'):
                            return json.loads(content.text)
                    except (json.JSONDecodeError, AttributeError) as e:
                        self.logger.error(f"Error parsing query result: {e}")
                        
                return {}
    
    async def test_connection(self) -> bool:
        """Test if we can connect to the MCP server."""
        try:
            self.logger.debug("Testing MCP connection")
            
            async with streamablehttp_client(self.mcp_url) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    
                    # Try to list tools to verify connection
                    tools = await session.list_tools()
                    self.logger.debug(f"Connected successfully, found {len(tools.tools)} tools")
                    return True
                    
        except Exception as e:
            self.logger.error(f"Failed to connect to MCP server: {e}")
            return False


async def test_simple_mcp_client():
    """Test the SimpleMCPClient."""
    import os
    
    mcp_url = os.environ.get("MCP_URL", "http://localhost:4040/mcp")
    client = SimpleMCPClient(mcp_url)
    
    print(f"Testing connection to {mcp_url}...")
    
    # Test connection
    connected = await client.test_connection()
    print(f"Connection test: {'✅ Success' if connected else '❌ Failed'}")
    
    if connected:
        # Test listing projects
        try:
            projects = await client.list_projects()
            print(f"Found {len(projects)} projects: {[p.get('name', 'unnamed') for p in projects]}")
            
            if projects:
                project_name = projects[0].get('name')
                if project_name:
                    packages = await client.list_packages(project_name)
                    print(f"Found {len(packages)} packages in {project_name}")
                    
        except Exception as e:
            print(f"Error testing client: {e}")


if __name__ == "__main__":
    asyncio.run(test_simple_mcp_client())