"""
Unit tests for Enhanced MCP Client (SDK-based implementation)

Tests the basic functionality without requiring a real MCP server
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from mcp import types

from src.clients.enhanced_mcp_client import (
    EnhancedMCPClient, 
    MCPConfig, 
    MCPError, 
    MCPConnectionError, 
    MCPAuthError,
    MCPTimeoutError
)

class TestMCPConfig:
    """Test MCPConfig dataclass"""
    
    def test_config_creation_with_defaults(self):
        """Test creating config with minimal required parameters"""
        config = MCPConfig(url="http://localhost:4040/mcp")
        
        assert config.url == "http://localhost:4040/mcp"
        assert config.auth_token is None
        assert config.timeout == 30
        assert config.max_retries == 3
        assert config.base_delay == 1.0
        assert config.max_delay == 60.0
    
    def test_config_creation_with_auth(self):
        """Test creating config with authentication"""
        config = MCPConfig(
            url="https://production.com/mcp",
            auth_token="test-token-123",
            timeout=60
        )
        
        assert config.url == "https://production.com/mcp"
        assert config.auth_token == "test-token-123"
        assert config.timeout == 60

    def test_config_creation_with_oauth(self):
        """Test creating config with OAuth settings"""
        config = MCPConfig(
            url="https://production.com/mcp",
            oauth_client_name="Test Client",
            oauth_redirect_uri="http://localhost:3000/callback",
            oauth_scopes="user admin"
        )
        
        assert config.oauth_client_name == "Test Client"
        assert config.oauth_redirect_uri == "http://localhost:3000/callback"
        assert config.oauth_scopes == "user admin"


class TestEnhancedMCPClient:
    """Test EnhancedMCPClient functionality with SDK-based implementation"""
    
    @pytest.fixture
    def config(self):
        """Provide test configuration"""
        return MCPConfig(url="http://localhost:4040")
    
    @pytest.fixture
    def config_with_oauth(self):
        """Provide test configuration with OAuth"""
        return MCPConfig(
            url="https://production.com",
            oauth_client_name="Test Client",
            oauth_redirect_uri="http://localhost:3000/callback",
            oauth_scopes="user"
        )
    
    def test_client_initialization(self, config):
        """Test client can be initialized with config"""
        client = EnhancedMCPClient(config)
        
        assert client.config == config
        assert client.session is None
        assert client.available_tools == {}
        assert client._client_streams is None
    
    def test_oauth_detection(self, config, config_with_oauth):
        """Test OAuth detection logic"""
        client_no_oauth = EnhancedMCPClient(config)
        client_with_oauth = EnhancedMCPClient(config_with_oauth)
        
        assert not client_no_oauth._should_use_oauth()
        assert client_with_oauth._should_use_oauth()
    
    @pytest.mark.asyncio
    async def test_session_creation_success(self, config):
        """Test successful session creation"""
        client = EnhancedMCPClient(config)
        
        # Mock the SDK components
        mock_streams = (AsyncMock(), AsyncMock(), AsyncMock())
        mock_session = AsyncMock()
        
        with patch('src.clients.enhanced_mcp_client.streamablehttp_client') as mock_client:
            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_streams)
            mock_client.return_value = mock_context
            
            with patch('src.clients.enhanced_mcp_client.ClientSession') as mock_session_class:
                mock_session_class.return_value = mock_session
                mock_session.__aenter__ = AsyncMock(return_value=mock_session)
                mock_session.initialize = AsyncMock()
                
                await client._create_session()
                
                # Verify the session was created and initialized
                mock_client.assert_called_once_with("http://localhost:4040/mcp", auth=None)
                mock_session_class.assert_called_once()
                mock_session.initialize.assert_called_once()
                assert client.session == mock_session
    
    @pytest.mark.asyncio
    async def test_session_creation_failure(self, config):
        """Test session creation failure handling"""
        client = EnhancedMCPClient(config)
        
        with patch('src.clients.enhanced_mcp_client.streamablehttp_client') as mock_client:
            mock_client.side_effect = Exception("Connection failed")
            
            with pytest.raises(MCPConnectionError) as exc_info:
                await client._create_session()
            
            assert "Failed to connect to MCP server" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_discover_tools_success(self, config):
        """Test successful tool discovery"""
        client = EnhancedMCPClient(config)
        
        # Mock session and tools response
        mock_session = AsyncMock()
        client.session = mock_session
        
        # Create mock tools response
        mock_tools = [
            types.Tool(
                name="test_tool_1",
                description="Test tool 1",
                inputSchema={"type": "object", "properties": {}}
            ),
            types.Tool(
                name="test_tool_2", 
                description="Test tool 2",
                inputSchema={"type": "object", "properties": {"param": {"type": "string"}}}
            )
        ]
        
        mock_tools_response = types.ListToolsResult(tools=mock_tools)
        mock_session.list_tools.return_value = mock_tools_response
        
        tools = await client.discover_tools()
        
        # Verify tools were discovered correctly
        assert len(tools) == 2
        assert "test_tool_1" in tools
        assert "test_tool_2" in tools
        assert tools["test_tool_1"]["description"] == "Test tool 1"
        assert tools["test_tool_2"]["description"] == "Test tool 2"
    
    @pytest.mark.asyncio
    async def test_discover_tools_failure(self, config):
        """Test tool discovery failure"""
        client = EnhancedMCPClient(config)
        
        mock_session = AsyncMock()
        mock_session.list_tools.side_effect = Exception("Discovery failed")
        client.session = mock_session
        
        with pytest.raises(MCPError) as exc_info:
            await client.discover_tools()
        
        assert "Failed to discover tools" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_call_tool_success(self, config):
        """Test successful tool call"""
        client = EnhancedMCPClient(config)
        
        # Setup session and available tools
        mock_session = AsyncMock()
        client.session = mock_session
        client.available_tools = {"test_tool": {"name": "test_tool"}}
        
        # Mock tool call response
        mock_result = types.CallToolResult(
            content=[
                types.TextContent(type="text", text="Tool result")
            ],
            isError=False
        )
        mock_session.call_tool.return_value = mock_result
        
        result = await client.call_tool("test_tool", {"param": "value"})
        
        # Verify the result format
        assert result["isError"] is False
        assert len(result["content"]) == 1
        assert result["content"][0]["type"] == "text"
        assert result["content"][0]["text"] == "Tool result"
        
        mock_session.call_tool.assert_called_once_with("test_tool", {"param": "value"})
    
    @pytest.mark.asyncio
    async def test_call_tool_not_available(self, config):
        """Test calling unavailable tool"""
        client = EnhancedMCPClient(config)
        
        mock_session = AsyncMock()
        client.session = mock_session
        client.available_tools = {"other_tool": {"name": "other_tool"}}
        
        with pytest.raises(MCPError) as exc_info:
            await client.call_tool("nonexistent_tool", {})
        
        assert "Tool 'nonexistent_tool' not available" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_call_tool_failure(self, config):
        """Test tool call failure"""
        client = EnhancedMCPClient(config)
        
        mock_session = AsyncMock()
        mock_session.call_tool.side_effect = Exception("Tool execution failed")
        client.session = mock_session
        client.available_tools = {"test_tool": {"name": "test_tool"}}
        
        with pytest.raises(MCPError) as exc_info:
            await client.call_tool("test_tool", {})
        
        assert "Tool 'test_tool' failed" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_list_resources(self, config):
        """Test listing resources"""
        client = EnhancedMCPClient(config)
        
        mock_session = AsyncMock()
        client.session = mock_session
        
        # Mock resources response
        mock_resources = [
            types.Resource(
                uri="test://resource1",
                name="Resource 1",
                description="Test resource 1",
                mimeType="text/plain"
            )
        ]
        mock_response = types.ListResourcesResult(resources=mock_resources)
        mock_session.list_resources.return_value = mock_response
        
        resources = await client.list_resources()
        
        assert len(resources) == 1
        assert resources[0]["uri"] == "test://resource1"
        assert resources[0]["name"] == "Resource 1"
    
    @pytest.mark.asyncio
    async def test_close_session(self, config):
        """Test session cleanup"""
        client = EnhancedMCPClient(config)
        
        # Mock session
        mock_session = AsyncMock()
        mock_session.__aexit__ = AsyncMock()
        client.session = mock_session
        
        await client.close()
        
        mock_session.__aexit__.assert_called_once()
        assert client.session is None
    
    @pytest.mark.asyncio
    async def test_context_manager(self, config):
        """Test async context manager functionality"""
        with patch.object(EnhancedMCPClient, '_create_session', new_callable=AsyncMock) as mock_create:
            with patch.object(EnhancedMCPClient, 'discover_tools', new_callable=AsyncMock) as mock_discover:
                with patch.object(EnhancedMCPClient, 'close', new_callable=AsyncMock) as mock_close:
                    mock_discover.return_value = {}
                    
                    async with EnhancedMCPClient(config) as client:
                        assert isinstance(client, EnhancedMCPClient)
                        mock_create.assert_called_once()
                        mock_discover.assert_called_once()
                    
                    # Verify cleanup was called
                    mock_close.assert_called_once()


class TestMCPExceptions:
    """Test MCP exception classes"""
    
    def test_mcp_error_inheritance(self):
        """Test exception inheritance"""
        assert issubclass(MCPConnectionError, MCPError)
        assert issubclass(MCPAuthError, MCPError)
        assert issubclass(MCPTimeoutError, MCPError)
    
    def test_exception_messages(self):
        """Test exception message handling"""
        conn_error = MCPConnectionError("Connection failed")
        auth_error = MCPAuthError("Auth failed")
        timeout_error = MCPTimeoutError("Timeout")
        
        assert str(conn_error) == "Connection failed"
        assert str(auth_error) == "Auth failed" 
        assert str(timeout_error) == "Timeout"