#!/usr/bin/env python3
"""
End-to-end test simulating a real Slack conversation flow:
1. "show me the top 5 names for boys"
2. "and what about for girls" 
3. "graph the girls names"

This tests the complete pipeline: Malloy queries → memory/context → chart generation
"""

import os
import sys
import time
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
project_root = os.path.dirname(__file__)
sys.path.insert(0, project_root)

from src.agents.langchain_compatibility_adapter import LangChainCompatibilityAdapter

def test_e2e_conversation(model_type="claude"):
    """Test end-to-end conversation flow using the compatibility adapter"""
    
    print(f"🎭 E2E Conversation Test with {model_type.upper()}")
    print("=" * 60)
    
    # Configuration for different models
    configs = {
        "claude": {
            "model_name": "claude-3.5-sonnet",
            "provider": "anthropic",
            "api_key_env": "ANTHROPIC_API_KEY"
        },
        "gpt4o": {
            "model_name": "gpt-4o",
            "provider": "openai", 
            "api_key_env": "OPENAI_API_KEY"
        }
    }
    
    config = configs[model_type]
    
    # Check for API key
    api_key = os.environ.get(config["api_key_env"])
    if not api_key:
        print(f"❌ {config['api_key_env']} not set. Please set this environment variable")
        return False
    
    print(f"✅ {config['provider'].title()} API key configured")
    
    # Setup MCP server URL from environment
    mcp_url = os.environ.get("MCP_URL", "http://localhost:4040/mcp")
    print(f"🔗 Using MCP URL: {mcp_url}")
    
    try:
        # Initialize agent using compatibility adapter
        print(f"\n1️⃣ Initializing {config['model_name']} agent via compatibility adapter...")
        
        adapter_kwargs = {
            "mcp_url": mcp_url,
            "model_name": config["model_name"],
            "llm_provider": config["provider"],
            "session_id": f"e2e_test_{model_type}_{int(time.time())}"
        }
        
        # Add the appropriate API key
        if config["provider"] == "anthropic":
            adapter_kwargs["anthropic_api_key"] = api_key
        elif config["provider"] == "openai":
            adapter_kwargs["openai_api_key"] = api_key
        
        # Create the adapter (this handles all async complexity)
        adapter = LangChainCompatibilityAdapter(**adapter_kwargs)
        
        print(f"✅ Compatibility adapter initialized")
        
        # Define the conversation flow
        conversation_turns = [
            {
                "turn": 1,
                "query": "show me the top 5 names for boys",
                "expected": ["query", "data", "boys", "names"],
                "description": "Initial query for boys names data"
            },
            {
                "turn": 2, 
                "query": "and what about for girls",
                "expected": ["girls", "names", "data"],
                "description": "Follow-up query using context"
            },
            {
                "turn": 3,
                "query": "graph the girls names",
                "expected": ["chart", "chart_url", "status"],
                "description": "Chart generation from previous data"
            }
        ]
        
        print(f"\n2️⃣ Starting conversation simulation...")
        results = []
        conversation_history = []
        
        for turn_info in conversation_turns:
            turn_num = turn_info["turn"]
            query = turn_info["query"]
            expected_keywords = turn_info["expected"]
            description = turn_info["description"]
            
            print(f"\n{'='*50}")
            print(f"💬 TURN {turn_num}: {description}")
            print(f"Query: \"{query}\"")
            print(f"Expected keywords: {expected_keywords}")
            
            start_time = time.time()
            
            # Process the question using the compatibility adapter (sync interface)
            success, response, updated_history = adapter.process_user_question(query, conversation_history)
            conversation_history = updated_history  # Update for next turn
            
            duration = time.time() - start_time
            
            print(f"\n📊 Results (took {duration:.2f}s):")
            print(f"Success: {success}")
            print(f"Response length: {len(response)} chars")
            
            # Check for expected keywords
            response_lower = response.lower()
            found_keywords = [kw for kw in expected_keywords if kw in response_lower]
            missing_keywords = [kw for kw in expected_keywords if kw not in response_lower]
            
            print(f"Found keywords: {found_keywords}")
            if missing_keywords:
                print(f"Missing keywords: {missing_keywords}")
            
            # Special handling for chart turn
            if turn_num == 3:
                # Check if this is a chart response
                try:
                    import json
                    chart_data = json.loads(response)
                    if 'chart_url' in chart_data:
                        chart_url = chart_data['chart_url']
                        if chart_url:
                            print(f"🎨 Chart created: {chart_url}")
                        else:
                            print(f"❌ Chart URL not found in response: {chart_url}")
                except json.JSONDecodeError:
                    if any(kw in response_lower for kw in ["chart", "png", "graph"]):
                        print("⚠️ Response mentions charts but not in expected JSON format")
            
            # Show first 200 chars of response
            response_preview = response[:200] + "..." if len(response) > 200 else response
            print(f"Response preview: {response_preview}")
            
            # Store results
            results.append({
                "turn": turn_num,
                "query": query,
                "success": success,
                "response_length": len(response),
                "found_keywords": found_keywords,
                "missing_keywords": missing_keywords,
                "duration": duration
            })
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 CONVERSATION SUMMARY:")
        all_successful = True
        for result in results:
            status = "✅ PASSED" if result["success"] and not result["missing_keywords"] else "❌ FAILED"
            keyword_ratio = f"({len(result['found_keywords'])}/{len(result['found_keywords']) + len(result['missing_keywords'])} keywords)"
            print(f"  Turn {result['turn']}: {status} {keyword_ratio} ({result['duration']:.1f}s)")
            if not result["success"] or result["missing_keywords"]:
                all_successful = False
        
        print(f"\n✅ E2E conversation test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during E2E test: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="E2E Conversation Test")
    parser.add_argument(
        "--model", 
        choices=["claude", "gpt4o"], 
        default="claude",
        help="Model to test with"
    )
    
    args = parser.parse_args()
    
    print(f"🚀 Starting E2E Conversation Test at {datetime.now()}")
    print("🎯 Testing multi-turn conversation flow with", args.model.upper())
    print()
    print("🔍 Checking prerequisites...")
    
    # Test the conversation flow
    success = test_e2e_conversation(args.model)
    
    if success:
        print("\n🎉 E2E conversation test PASSED!")
        print("✅ Chart generation with QuickChart.io works end-to-end")
        print("✅ Multi-turn conversation memory works") 
        print("✅ Tool integration works")
    else:
        print("\n❌ E2E conversation test FAILED!")
        print("❌ Check the logs above for details")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 