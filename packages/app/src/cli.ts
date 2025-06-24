#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CLIOptions {
   port?: number;
   host?: string;
   serverRoot?: string;
   help?: boolean;
}

function parseArgs(): CLIOptions {
   const args = process.argv.slice(2);
   const options: CLIOptions = {};

   for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
         case "--port":
         case "-p":
            options.port = parseInt(args[++i]);
            break;
         case "--host":
         case "-h":
            options.host = args[++i];
            break;
         case "--server-root":
         case "-r":
            options.serverRoot = args[++i];
            break;
         case "--help":
            options.help = true;
            break;
      }
   }

   return options;
}

function showHelp() {
   console.log(`
Malloy Publisher App - Standalone Server

Usage: malloy-publisher-app [options]

Options:
  -p, --port <number>        Port to run the server on (default: 4000)
  -h, --host <string>        Host to bind the server to (default: localhost)  
  -r, --server-root <path>   Root directory for Malloy projects (default: current directory)
  --help                     Show this help message

Examples:
  malloy-publisher-app                                    # Start with defaults
  malloy-publisher-app --port 3000                       # Start on port 3000
  malloy-publisher-app --host 0.0.0.0 --port 8080       # Bind to all interfaces on port 8080
  malloy-publisher-app --server-root /path/to/projects   # Use custom project root
`);
}

async function startServer(options: CLIOptions) {
   try {
      // Try to find the server package
      const serverPath = path.resolve(__dirname, "../../server/dist/server.js");

      console.log("🚀 Starting Malloy Publisher...");
      console.log(`📁 Server root: ${options.serverRoot || process.cwd()}`);
      console.log(`🌐 Host: ${options.host || "localhost"}`);
      console.log(`🔌 Port: ${options.port || 4000}`);
      console.log("");

      // Set environment variables
      const env = {
         ...process.env,
         PUBLISHER_PORT: (options.port || 4000).toString(),
         PUBLISHER_HOST: options.host || "localhost",
         SERVER_ROOT: options.serverRoot || process.cwd(),
         NODE_ENV: "production",
         APP_DIST_PATH: path.resolve(__dirname, "app"),
      };

      // Start the server
      const serverProcess = spawn("bun", ["run", serverPath], {
         env,
         stdio: "inherit",
      });

      // Handle process termination
      process.on("SIGINT", () => {
         console.log("\n🛑 Shutting down Malloy Publisher...");
         serverProcess.kill("SIGINT");
         process.exit(0);
      });

      process.on("SIGTERM", () => {
         serverProcess.kill("SIGTERM");
         process.exit(0);
      });

      serverProcess.on("exit", (code) => {
         if (code !== 0) {
            console.error(`❌ Server exited with code ${code}`);
            process.exit(code || 1);
         }
      });

      serverProcess.on("error", (error) => {
         console.error("❌ Failed to start server:", error.message);

         if (error.message.includes("ENOENT")) {
            console.error("");
            console.error(
               "It looks like the Malloy Publisher server is not installed.",
            );
            console.error(
               "Make sure @malloy-publisher/server is available in your node_modules.",
            );
            console.error("");
            console.error("Try running: npm install @malloy-publisher/server");
         }

         process.exit(1);
      });
   } catch (error) {
      console.error("❌ Error starting Malloy Publisher:", error);
      process.exit(1);
   }
}

async function main() {
   const options = parseArgs();

   if (options.help) {
      showHelp();
      return;
   }

   await startServer(options);
}

main().catch((error) => {
   console.error("❌ Unexpected error:", error);
   process.exit(1);
});
