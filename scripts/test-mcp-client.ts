import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { URL } from "url";
// Use the client import path, acknowledging the linter/runtime issue in this context
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
// Removed unused NotificationSchema imports from example for simplicity

// --- Configuration ---
const mcpServerUrl = "http://localhost:4001/mcp"; // Correct server URL + endpoint

// Protocol client that maintain 1:1 connection with servers
class MCPTestClient { // Renamed class for clarity
    private client: Client;
    private transport: StreamableHTTPClientTransport | null = null;
    public isCompleted = false;
    private serverName = "malloy-publisher-mcp-server"; // Descriptive name

    constructor() { // Simplified constructor
        this.client = new Client({ name: `mcp-test-client-for-${this.serverName}`, version: "1.0.0" });
        console.log(`[CLIENT] Client created for ${this.serverName}`);
    }

    async connectToServer() { // Combined URL construction and connection
        console.log(`[CLIENT] Attempting to connect via Streamable HTTP: ${mcpServerUrl}`);
        const url = new URL(mcpServerUrl);
        try {
            this.transport = new StreamableHTTPClientTransport(url);
            console.log(`[CLIENT] StreamableHTTPClientTransport created.`);
            
            console.log('[CLIENT] Connecting...');
            await this.client.connect(this.transport);
            console.log("[CLIENT] Connected to server via transport.");

            this.setUpTransport();

            // Optional: Make a simple request after connection
            await this.listResources();

        } catch (e) {
            console.error("[CLIENT] Failed to connect to MCP server: ", e);
            this.isCompleted = true; // Mark as completed on connection failure
            // throw e; // Decide if throwing is necessary, example didn't re-throw here
        }
    }


    private setUpTransport() {
        if (this.transport === null) {
            return;
        }
        // Called when the server closes the connection or client.close() is called
        this.transport.onclose = () => { 
            console.log("[CLIENT] Transport closed.");
            this.isCompleted = true;
        };

        this.transport.onerror = async (error) => {
            console.error("[CLIENT] Transport error: ", error);
            this.isCompleted = true; // Mark as completed on error
            // Example called cleanup here, but let's let the main loop handle it
            // await this.cleanup(); 
        };

        // Called for server-sent notifications (not request responses)
        this.transport.onmessage = (message) => { 
            console.log("[CLIENT] Notification message received: ", JSON.stringify(message, null, 2));
            // Example just logged, add specific handling if needed
        };
    }

    // Added listResources example call
    async listResources() {
        try {
            console.log(`[CLIENT] Calling method: mcp/listResources`);
            const listResult = await this.client.listResources();
            console.log(`[CLIENT] Method "mcp/listResources" successful! Result: ${JSON.stringify(listResult, null, 2)}`);
        } catch (error) {
             console.error('[CLIENT] Error calling listResources:', error);
        }
    }

    async waitForCompletion() {
        console.log("[CLIENT] Waiting for completion (transport close)...");
        while (!this.isCompleted) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Check every 500ms
        }
        console.log("[CLIENT] Completion condition met.");
    }

    async cleanup() {
        console.log('[CLIENT] Cleaning up...');
        // Check transport first, as client.close() might trigger transport.onclose
        if (this.transport && !this.isCompleted) { 
             console.log('[CLIENT] Closing transport...');
            // transport doesn't have an explicit close, client.close() handles it.
        }
         if (this.client) {
             console.log('[CLIENT] Closing client...');
             // This should trigger transport.onclose if connected
            await this.client.close().catch(e => console.error('[CLIENT] Error during client close:', e)); 
         }
        this.isCompleted = true; // Ensure completion flag is set
        console.log('[CLIENT] Cleanup finished.');
    }
}

async function main() {
    const client = new MCPTestClient();

    try {
        await client.connectToServer();
        // Only wait if connection was potentially successful
        if (!client.isCompleted) { 
             await client.waitForCompletion();
        } else {
            console.log("[CLIENT] Skipping wait; connection failed or closed early.");
        }
    } catch(e) {
      console.error("[CLIENT] Unhandled error in main:", e); // Catch errors not handled in connect
    } finally {
        await client.cleanup();
    }
}

main();
