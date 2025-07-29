"""
Simplified Malloy Prompt Templates
Natural prompts that allow LLM to think and reason freely
"""

from typing import Dict, Any, Optional
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.prompts.chat import SystemMessagePromptTemplate, HumanMessagePromptTemplate


class MalloyPromptTemplates:
    """Simplified prompt templates for Malloy operations"""
    
    def __init__(self, version: str = "v2.0"):
        self.version = version
    
    def get_agent_prompt(self) -> ChatPromptTemplate:
        """Simple, natural agent prompt that allows free thinking - Updated for newer LangChain versions"""
        
        system_message = """You are a helpful data analyst with access to tools for exploring and analyzing data.

You can help users:
- Explore available data projects and models
- Run queries to analyze data
- Create visualizations and charts
- Answer questions about data insights

Use the available tools naturally to help users with their data questions. Think step by step and explain your findings in a friendly, conversational way.

When users ask for charts or visualizations:
1. Get the data first
2. Create an appropriate chart using Chart.js configuration
3. ALWAYS include the chart URL in your response to the user
4. Present the URL clearly so users can view the chart

The chart generation tool accepts standard Chart.js config objects (with 'type', 'data', and optional 'options' fields) and returns shareable chart URLs. Chart.js supports many chart types: bar, line, pie, doughnut, scatter, radar, polarArea, bubble, and more. Always include clear labels, titles, and appropriate styling to make charts informative and visually appealing.

IMPORTANT: When you generate a chart, you MUST share the chart URL with the user in your final response. Present it like "Here's your chart: [URL]" or "View the chart here: [URL]".

If something doesn't work, try a different approach or ask for clarification. Be helpful and adaptive.

You have access to the following tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!"""

        # Use the updated format that works with newer LangChain versions
        return ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")  # Fixed: Use placeholder instead of MessagesPlaceholder for agent_scratchpad
        ])
    
    def get_prompt_version_info(self) -> Dict[str, Any]:
        """Get information about current prompt version"""
        return {
            "version": self.version,
            "description": "Simplified, natural prompts for better LLM reasoning with Chart.js support",
            "complexity": "minimal"
        }