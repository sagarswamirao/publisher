# AI Agents (Model Context Protocol)

## 1. Introduction

This guide demonstrates how you can have a natural language, AI-powered conversation with your data. We will use the open-source Malloy ecosystem, specifically a Malloy MCP server, to provide Anthropic's Claude with governed access to a semantic model defined in the Malloy language.

The goal is to move beyond dashboards and reports to a state where you can ask complex questions of your data in plain English and receive trustworthy, accurate, and context-aware answers. This workflow showcases the future of data interaction, where a powerful Large Language Model (LLM) can perform sophisticated analysis by leveraging a well-defined semantic layer.

### Key Components

1.  **The Malloy Model:** A governed foundation of business meaning, defining key dimensions, measures, and relationships in your data.
2.  **Malloy Publisher (MCP Server):** An implementation of the Model Context Protocol (MCP) that exposes the semantic model to LLMs and AI agents.
3.  **The Python Bridge Script:** An intermediary script to translate communication between Claude's tool-use format and the MCP server.
4.  **Claude:** The AI assistant that will use the provided tools and context to have a conversation with your data.

---

## 2. Prerequisites

Before you begin, ensure you have the following set up:

* **A Malloy Model:** You should have a `.malloy` file that defines a semantic model. For this guide, we will reference the `hackernews.malloy` model available in the [Malloy Samples Data Repository](https://github.com/malloydata/malloy-samples).
* **Malloy Publisher:** You need to have cloned the open-source [Malloy Publisher repository](https://github.com/malloydata/malloy-publisher) and built the project by running `npm install` or `bun install`.
* **Node.js & Bun:** The Publisher server is run using Bun, a fast JavaScript runtime.
* **Python 3:** Required to run the bridge script that connects Claude to the local MCP server.
* **Claude Desktop App:** This guide uses the Claude desktop application, which allows for configuration with local development servers.

---

## 3. Setting Up the Environment

This process involves running the MCP server locally, setting up the Python bridge, and configuring Claude to communicate with it.

### Step 1: Start the Malloy Publisher MCP Server

The Publisher is the component that makes your semantic model available to Claude. It runs a local server that implements MCP (Model Context Protocol), an interface designed specifically for LLMs.

1.  Navigate to your cloned `malloy-publisher` directory in your terminal.
2.  Start the server by running the command:
    ```bash
    bun run start
    ```
> **[DELETE THIS BLOCK AND INSERT SCREENSHOT]**
> **Instructions for Screenshot:**
> 1. Run the `bun run start` command in your terminal.
> 2. Take a screenshot of the terminal window.
> 3. Ensure the output text "MCP server is now listening locally" is clearly visible.

3.  Once running, you should see a message indicating that the MCP server is listening locally, typically on port 4040. This server automatically makes the models in your project available.

### Step 2: Download and Understand the Python Bridge Script

To connect the Claude desktop app to the Malloy MCP server, a small intermediary script is needed.

* **Download the script here:** [malloy_bridge.py](https://raw.githubusercontent.com/malloydata/malloy-publisher/main/clients/claude/malloy_bridge.py)

**Why is this bridge script needed?**

This script acts as a "translator" between the Claude desktop app and the Malloy MCP server. The Claude client has specific expectations for how it communicates with external tools—for example, it expects tool names in the format `malloy_executeQuery`. The MCP server, however, uses a different naming convention, `malloy/executeQuery`. The bridge script handles this and other minor formatting differences, remapping requests and responses on the fly to ensure seamless communication.

It's important to note that this script is a specific compatibility layer for the current Claude desktop client. Other MCP clients or future versions of the Claude app may not require this bridge if they align directly with the MCP specification.

### Step 3: Configure the Claude Desktop App

Now, you need to tell Claude to use your downloaded Python bridge script as a local MCP server.

1.  In the Claude desktop app, navigate to **Settings > Developer > Edit Config**.

> **[DELETE THIS BLOCK AND INSERT SCREENSHOT]**
> **Instructions for Screenshot:**
> 1. Open the Claude desktop app and navigate to the Developer Settings page.
> 2. Take a screenshot of the window.
> 3. Use an arrow or a highlighted box to point specifically to the "Edit Config" button.

2.  This will open a JSON configuration file.
3.  Add or edit the `mcpServers` section to look like this, replacing the placeholder path with the **actual path** to where you saved the `malloy_bridge.py` script.

    ```json
    {
      "mcpServers": {
        "malloy": {
          "command": "python3",
          "args": ["/path/to/your/malloy_bridge.py"],
          "env": {},
          "disabled": false
        }
      }
    }
    ```

4.  Save the configuration file. Claude will now route requests for the "malloy" tool through your Python script.

---

## 4. Initiating the Conversation

With the server running and Claude configured, you can start the conversation. Because current versions of the MCP client don't fully support automatic discovery, you begin by providing the model definition as context.

1.  Open your `.malloy` model file (e.g., `hackernews.malloy`) in a text editor.
2.  Copy the entire contents of the file.
3.  In a new conversation in Claude, paste the model code as your first message. You can preface it with a prompt like the one in the next section.

Once context is provided, Claude will parse the model to understand the available dimensions, measures, and predefined views and use them to answer your questions.

> **[DELETE THIS BLOCK AND INSERT GIF]**
> **Instructions for GIF:**
> 1. Start the GIF showing the Malloy model code being copied from a text editor (like VS Code).
> 2. Switch to the Claude app interface.
> 3. Show the model code being pasted into a new chat.
> 4. As Claude processes, capture and highlight the "Using tool: malloy_executeQuery" indicator badge.
> 5. End the GIF showing the final, text-based EDA summary appearing in the chat.

---

## 5. Example Prompts and Conversation Flow

Here are some examples of how a conversation with Claude and the Hacker News model might unfold, from broad questions to more specific, follow-up inquiries.

### Example 1: The Initial Prompt & EDA

This is the crucial first step where you provide the model context. Claude will use this to understand the schema and then run several queries to build an initial summary.

> **You:** "Please perform an exploratory data analysis of the Hacker News dataset. Use the tools available to you. Here is the Malloy model that defines the data structure:"
>
> *\[paste your entire `hackernews.malloy` model code here]*
>
> **Claude:** *(After several tool calls to run queries like `by_post_type`, `top_posters`, etc.)*
>
> "The Hacker News dataset contains X stories and Y comments. The posts cover a wide range of topics, with the highest scores often going to technical articles and launch announcements. The most active user is 'tptacek'..."

### Example 2: Exploring High-Level Aggregates

Ask for simple counts and totals. Claude will use the measures defined in the model, like `count` or `total_score`.

> **You:** "How many posts are there of each type?"
>
> **Claude:** *(Runs a query grouping by `post_type` and aggregating `count`.)*
>
> "There are:
> * Stories: X
> * Comments: Y
> * Jobs: Z"

### Example 3: Using Predefined Views

Your Malloy model can contain predefined queries called "views." You can ask questions that directly reference them.

> **You:** "What are the top submitted websites?"
>
> **Claude:** *(Recognizes this maps to the `top_sites` view and executes it.)*
>
> "The most frequently submitted domains are:
> 1.  github.com
> 2.  youtube.com
> 3.  ..."

### Example 4: Follow-up Questions

The true power of this interface is its conversational nature. You can ask follow-up questions based on previous results.

> **You:** "You mentioned 'tptacek' is a top poster. Can you show me their 5 most recent posts?"
>
> **Claude:** *(Constructs a new query, filtering `by user_id = 'tptacek'`, ordering by `timestamp` descending, and adding `limit: 5`.)*
>
> "Here are the 5 most recent posts by tptacek: ..."

These examples illustrate how Claude leverages the semantic model to deconstruct natural language questions into executable, trustworthy queries, allowing for a fluid and powerful data exploration experience.

> **[DELETE THIS BLOCK AND INSERT SCREENSHOT]**
> **Instructions for Screenshot:**
> 1. Take a screenshot of the Claude chat interface.
> 2. The screenshot should show a complete interaction, including:
>    - A user prompt (e.g., "What are the top submitted websites?").
>    - The "Used malloy_executeQuery" badge.
>    - Claude's final, formatted answer.