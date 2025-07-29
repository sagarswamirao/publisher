"""
Dynamic Malloy Tools Factory

Creates LangChain tools dynamically from MCP server capabilities.
Now uses SimpleMCPClient which follows proper MCP SDK patterns.
"""

import json
import logging
from typing import Dict, Any, List

from langchain.tools import BaseTool
from pydantic import BaseModel, Field

from ..clients.simple_mcp_client import SimpleMCPClient
from ..tools.quickchart_tool import QuickChartTool


class MalloyToolInput(BaseModel):
    """Input schema for Malloy tools"""
    project_name: str = Field(description="The project name to work with")
    package_name: str = Field(description="The package name within the project")
    model_path: str = Field(description="Path to the Malloy model file")
    query: str = Field(default="", description="Optional Malloy query to execute")
    query_name: str = Field(default="", description="Optional named query to execute")


class DynamicMalloyTool(BaseTool):
    """A LangChain tool that wraps MCP Malloy operations"""
    
    def __init__(self, mcp_client: SimpleMCPClient, tool_name: str, description: str):
        # Store these as instance variables first
        self._mcp_client = mcp_client
        self._logger = logging.getLogger(__name__)
        
        # Call super with required fields
        super().__init__(
            name=tool_name,
            description=description,
            args_schema=MalloyToolInput
        )

    def _run(self, **kwargs) -> str:
        """Synchronous wrapper - should not be called directly"""
        raise NotImplementedError("This tool requires async execution. Use _arun instead.")

    async def _arun(
        self,
        project_name: str,
        package_name: str,
        model_path: str,
        query: str = "",
        query_name: str = "",
        **kwargs
    ) -> str:
        """Execute the Malloy tool operation"""
        try:
            self._logger.debug(f"Executing {self.name} with project={project_name}, package={package_name}, model={model_path}")
            
            if self.name == "malloy_projectList":
                # List all projects
                projects = await self._mcp_client.list_projects()
                return json.dumps({
                    "operation": "list_projects",
                    "success": True,
                    "projects": projects,
                    "count": len(projects)
                })
                
            elif self.name == "malloy_packageList":
                # List packages for a project
                packages = await self._mcp_client.list_packages(project_name)
                return json.dumps({
                    "operation": "list_packages",
                    "success": True,
                    "project": project_name,
                    "packages": packages,
                    "count": len(packages)
                })
                
            elif self.name == "malloy_packageGet":
                # Get package details
                package_details = await self._mcp_client.get_package(project_name, package_name)
                return json.dumps({
                    "operation": "get_package",
                    "success": True,
                    "project": project_name,
                    "package": package_name,
                    "details": package_details
                })
                
            elif self.name == "malloy_modelGetText":
                # Get model text content
                model_text = await self._mcp_client.get_model_text(project_name, package_name, model_path)
                return json.dumps({
                    "operation": "get_model_text",
                    "success": True,
                    "project": project_name,
                    "package": package_name,
                    "model_path": model_path,
                    "content": model_text,
                    "content_length": len(model_text)
                })
                
            elif self.name == "malloy_executeQuery":
                # Execute a Malloy query
                result = await self._mcp_client.execute_query(
                    project_name=project_name,
                    package_name=package_name,
                    model_path=model_path,
                    query=query if query else None,
                    query_name=query_name if query_name else None
                )
                return json.dumps({
                    "operation": "execute_query",
                    "success": True,
                    "project": project_name,
                    "package": package_name,
                    "model_path": model_path,
                    "query": query,
                    "query_name": query_name,
                    "result": result
                })
                
            else:
                return json.dumps({
                    "operation": self.name,
                    "success": False,
                    "error": f"Unknown tool: {self.name}"
                })
                
        except Exception as e:
            self._logger.error(f"Error executing {self.name}: {e}")
            return json.dumps({
                "operation": self.name,
                "success": False,
                "error": str(e),
                "project": project_name,
                "package": package_name,
                "model_path": model_path
            })


class MalloyToolsFactory:
    """Factory for creating Malloy tools from MCP server capabilities"""
    
    def __init__(self, mcp_url: str):
        self.mcp_url = mcp_url
        self.mcp_client = SimpleMCPClient(mcp_url)
        self.logger = logging.getLogger(__name__)

    async def create_tools(self) -> List[BaseTool]:
        """Create all available tools"""
        try:
            self.logger.info("Creating Malloy tools using SimpleMCPClient")
            
            # Test connection first
            connected = await self.mcp_client.test_connection()
            if not connected:
                self.logger.error("Failed to connect to MCP server")
                return [QuickChartTool()]
            
            # Create the standard Malloy tools
            malloy_tools = [
                DynamicMalloyTool(
                    self.mcp_client,
                    "malloy_projectList",
                    "List all available Malloy projects. Use this to discover what data projects are available for analysis."
                ),
                DynamicMalloyTool(
                    self.mcp_client,
                    "malloy_packageList", 
                    "List packages within a specific Malloy project. Requires project_name parameter."
                ),
                DynamicMalloyTool(
                    self.mcp_client,
                    "malloy_packageGet",
                    "Get detailed information about a specific package, including available models. Requires project_name and package_name."
                ),
                DynamicMalloyTool(
                    self.mcp_client,
                    "malloy_modelGetText",
                    "Get the raw Malloy model definition text. Useful for understanding data structure and available queries. Requires project_name, package_name, and model_path."
                ),
                DynamicMalloyTool(
                    self.mcp_client,
                    "malloy_executeQuery",
                    "Execute a Malloy query to retrieve data. You can provide either a custom 'query' string or use a 'query_name' for predefined queries. Requires project_name, package_name, and model_path."
                )
            ]
            
            # Add the chart generation tool
            chart_tool = QuickChartTool()
            
            all_tools = malloy_tools + [chart_tool]
            
            self.logger.info(f"Created {len(all_tools)} tools: {[tool.name for tool in all_tools]}")
            return all_tools
            
        except Exception as e:
            self.logger.error(f"Error creating Malloy tools: {e}")
            # Return at least the chart tool if Malloy tools fail
            return [QuickChartTool()]

    async def get_available_projects(self) -> List[Dict[str, Any]]:
        """Get list of available projects for reference"""
        try:
            projects = await self.mcp_client.list_projects()
            self.logger.debug(f"Found {len(projects)} projects")
            return projects
        except Exception as e:
            self.logger.error(f"Error getting projects: {e}")
            return []

    async def get_project_info(self, project_name: str) -> Dict[str, Any]:
        """Get detailed info about a specific project"""
        try:
            packages = await self.mcp_client.list_packages(project_name)
            return {
                "project": project_name,
                "packages": packages,
                "package_count": len(packages)
            }
        except Exception as e:
            self.logger.error(f"Error getting project info for {project_name}: {e}")
            return {"project": project_name, "packages": [], "package_count": 0}


async def test_malloy_tools_factory():
    """Test the Malloy tools factory"""
    import os
    
    mcp_url = os.environ.get("MCP_URL", "http://localhost:4040/mcp")
    factory = MalloyToolsFactory(mcp_url)
    
    print(f"Testing Malloy tools factory with {mcp_url}...")
    
    # Test tool creation
    tools = await factory.create_tools()
    print(f"Created {len(tools)} tools:")
    for tool in tools:
        print(f"  - {tool.name}: {tool.description}")
    
    # Test getting projects
    projects = await factory.get_available_projects()
    print(f"\nFound {len(projects)} projects:")
    for project in projects:
        print(f"  - {project.get('name', 'unnamed')}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_malloy_tools_factory())