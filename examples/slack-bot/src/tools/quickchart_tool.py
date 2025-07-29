"""
QuickChart.io Chart Generation Tool
Creates charts using Chart.js configurations via QuickChart.io web service
"""
import json
from typing import Dict, Any
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

try:
    from quickchart import QuickChart
except ImportError:
    QuickChart = None


class QuickChartInput(BaseModel):
    """Input for QuickChart tool"""
    chart_config: dict = Field(
        description=(
            "Chart.js configuration object. Must include 'type' (bar, line, pie, doughnut, scatter, radar, etc.) "
            "and 'data' with labels and datasets. "
            "\n\nExample: "
            "{\n"
            "  'type': 'bar',\n"
            "  'data': {\n"
            "    'labels': ['January', 'February', 'March'],\n"
            "    'datasets': [{\n"
            "      'label': 'Sales',\n"
            "      'data': [100, 150, 200],\n"
            "      'backgroundColor': ['#ff6384', '#36a2eb', '#cc65fe']\n"
            "    }]\n"
            "  },\n"
            "  'options': {\n"
            "    'responsive': true,\n"
            "    'plugins': {\n"
            "      'title': {\n"
            "        'display': true,\n"
            "        'text': 'Monthly Sales'\n"
            "      }\n"
            "    }\n"
            "  }\n"
            "}"
        )
    )
    width: int = Field(default=500, description="Chart width in pixels")
    height: int = Field(default=300, description="Chart height in pixels")
    title: str = Field(default="", description="Optional chart title to add to the chart")


class QuickChartTool(BaseTool):
    """Tool for generating charts using QuickChart.io service"""

    name: str = "generate_chart"
    description: str = (
        "Generate data visualizations using Chart.js configurations via QuickChart.io. "
        "Returns a URL to the chart image that can be shared or embedded. "
        "This tool is perfect for creating professional charts from data.\n\n"
        
        "Supported chart types: bar, line, pie, doughnut, scatter, radar, polarArea, bubble, and more.\n\n"
        
        "Chart.js configuration guidelines:\n"
        "- REQUIRED: 'type' field (e.g., 'bar', 'line', 'pie')\n"
        "- REQUIRED: 'data' object with 'labels' array and 'datasets' array\n"
        "- Each dataset needs 'label' and 'data' fields\n"
        "- Optional: 'options' for customization (titles, legends, axes, etc.)\n"
        "- Optional: 'backgroundColor' and 'borderColor' for styling\n\n"
        
        "Example usage workflow:\n"
        "1. Get data from previous query results\n"
        "2. Format data into Chart.js structure\n"
        "3. Choose appropriate chart type\n"
        "4. Add clear labels and titles\n"
        "5. Call this tool with the configuration"
    )
    args_schema: type[BaseModel] = QuickChartInput

    def _run(self, chart_config: dict, width: int = 500, height: int = 300, title: str = "") -> str:
        """Generate chart using QuickChart.io and return URL"""
        
        if QuickChart is None:
            return json.dumps({
                "text": "Chart generation failed: quickchart.io library not installed",
                "status": "error",
                "error": "missing_dependency",
                "suggestion": "Install the quickchart.io library: pip install quickchart.io"
            })
        
        try:
            # Validate basic chart config structure
            if not isinstance(chart_config, dict):
                raise ValueError("chart_config must be a dictionary")
            
            if "type" not in chart_config:
                raise ValueError("chart_config must include a 'type' field (e.g., 'bar', 'line', 'pie')")
            
            if "data" not in chart_config:
                raise ValueError("chart_config must include a 'data' field with labels and datasets")
            
            # Make a copy to avoid modifying the original
            config = chart_config.copy()
            
            # Add title to config if provided and not already present
            if title:
                if "options" not in config:
                    config["options"] = {}
                if "plugins" not in config["options"]:
                    config["options"]["plugins"] = {}
                if "title" not in config["options"]["plugins"]:
                    config["options"]["plugins"]["title"] = {
                        "display": True,
                        "text": title
                    }
            
            # Create QuickChart instance
            qc = QuickChart()
            qc.width = width
            qc.height = height
            qc.config = config
            
            # Get the chart URL
            chart_url = qc.get_url()
            
            return json.dumps({
                "text": "Chart created successfully!",
                "chart_url": chart_url,
                "status": "success",
                "width": width,
                "height": height,
                "chart_type": config.get("type", "unknown")
            })
            
        except ValueError as e:
            return json.dumps({
                "text": f"Chart configuration error: {str(e)}",
                "status": "error",
                "error": "invalid_config",
                "suggestion": "Check your Chart.js configuration. Ensure it has 'type' and 'data' fields."
            })
        except Exception as e:
            error_msg = str(e)
            return json.dumps({
                "text": f"Chart generation failed: {error_msg}",
                "status": "error",
                "error": "quickchart_api_error",
                "suggestion": "Check your internet connection and try again. If the error persists, try a simpler chart configuration."
            })

    async def _arun(self, chart_config: dict, width: int = 500, height: int = 300, title: str = "") -> str:
        """Async version of chart generation"""
        return self._run(chart_config, width, height, title)


def create_quickchart_tool() -> QuickChartTool:
    """Create a QuickChart tool instance"""
    return QuickChartTool()


# Example usage function for testing
def test_quickchart_tool():
    """Test the QuickChart tool with sample data"""
    
    tool = create_quickchart_tool()
    
    # Sample Chart.js configuration
    sample_config = {
        "type": "bar",
        "data": {
            "labels": ["Levi's", "Ray-Ban", "Columbia", "Carhartt", "Dockers"],
            "datasets": [{
                "label": "Total Sales",
                "data": [1772930.94, 867047.23, 780730.58, 549446.06, 494120.49],
                "backgroundColor": ["#42A5F5", "#66BB6A", "#FFA726", "#EF5350", "#AB47BC"]
            }]
        },
        "options": {
            "responsive": True,
            "plugins": {
                "title": {
                    "display": True,
                    "text": "Sales by Brand"
                }
            },
            "scales": {
                "y": {
                    "beginAtZero": True
                }
            }
        }
    }
    
    # Test the tool
    result = tool._run(sample_config, width=600, height=400)
    print("QuickChart tool result:")
    print(result)
    
    return result


if __name__ == "__main__":
    test_quickchart_tool()