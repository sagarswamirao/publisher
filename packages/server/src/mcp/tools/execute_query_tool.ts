import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
   McpError,
   ErrorCode,
   // type ExecuteToolResult, // Removed: Type not found/exported or inferred
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ProjectStore } from "../../service/project_store";
import { getModelForQuery } from "../handler_utils";
import { getMalloyErrorDetails, type ErrorDetails } from "../error_messages";
import { MCP_ERROR_MESSAGES } from "../mcp_constants";
import { buildMalloyUri } from "../handler_utils";

// Define the raw shape for the Zod schema
const executeQueryShape = {
   // Explicitly add projectName, making it required
   projectName: z.string().describe("Project name"),
   packageName: z.string().describe("Name of the package containing the model"),
   modelPath: z
      .string()
      .describe("Path to the .malloy model file within the package"),
   query: z
      .string()
      .optional()
      .describe("Ad-hoc Malloy query string (omit if using queryName)"),
   sourceName: z
      .string()
      .optional()
      .describe("Source name (required for named queries/views)"),
   queryName: z
      .string()
      .optional()
      .describe(
         "Named query or view defined in the model (omit if using query)",
      ),
};

// Infer the type from the Zod shape for use in the handler
type ExecuteQueryParams = z.infer<z.ZodObject<typeof executeQueryShape>>;

/**
 * Registers the malloy/executeQuery tool with the MCP server.
 */
export function registerExecuteQueryTool(
   mcpServer: McpServer,
   projectStore: ProjectStore,
): void {
   mcpServer.tool(
      "malloy/executeQuery",
      "Executes a Malloy query (either ad-hoc or a named query/view defined in a model) against the specified model and returns the results as JSON.",
      executeQueryShape, // Pass the raw shape, not the Zod object
      /** Handles requests for the malloy/executeQuery tool */
      async (params: ExecuteQueryParams) => {
         // Destructure projectName as well
         const {
            projectName,
            packageName,
            modelPath,
            query,
            sourceName,
            queryName,
         } = params;

         console.log(
            "[MCP Tool executeQuery] Received params:",
            JSON.stringify(params),
         ); // Log params

         const hasAdhocQuery = !!query;
         const hasNamedQuery = !!queryName;

         if (!hasAdhocQuery && !hasNamedQuery) {
            throw new McpError(
               ErrorCode.InvalidParams,
               MCP_ERROR_MESSAGES.MISSING_REQUIRED_PARAMS,
            );
         }
         if (hasAdhocQuery && hasNamedQuery) {
            throw new McpError(
               ErrorCode.InvalidParams,
               MCP_ERROR_MESSAGES.MUTUALLY_EXCLUSIVE_PARAMS,
            );
         }
         // Zod/SDK handles missing required fields (packageName, modelPath) based on the shape

         // --- Get Package and Model ---
         console.log(
            `[MCP Tool executeQuery] Calling getModelForQuery for ${projectName}/${packageName}/${modelPath}`,
         ); // Log before getModelForQuery
         const modelResult = await getModelForQuery(
            projectStore,
            projectName,
            packageName,
            modelPath,
         );

         console.log(
            "[MCP Tool executeQuery] Result from getModelForQuery:",
            modelResult,
         ); // Log result

         // Handle errors during package/model access (e.g., not found, initial compilation)
         if ("error" in modelResult) {
            // Format error details as structured JSON
            const errorJson = JSON.stringify(
               {
                  error: modelResult.error.message,
                  suggestions: modelResult.error.suggestions,
               },
               null,
               2,
            );
            return {
               isError: true,
               // Return as application/json nested inside a 'resource' type
               content: [
                  {
                     type: "resource", // Use 'resource' type
                     resource: {
                        type: "application/json", // Actual content type
                        uri: "error://executeQuery/modelAccess", // Placeholder URI
                        text: errorJson,
                     },
                  },
               ],
            };
         }

         // --- Execute Query ---
         const { model } = modelResult;
         console.log(
            `[MCP Tool executeQuery] Model found. Proceeding to execute query.`,
         ); // Log before getQueryResults
         try {
            // Construct the query string for named queries/views
            const queryString =
               query ?? // Use ad-hoc query if provided
               (queryName // Otherwise, construct from named query/view
                  ? `run: ${sourceName ? sourceName + "->" : ""}${queryName}`
                  : undefined); // Should not happen due to checks above

            if (!queryString) {
               // This should theoretically not be reached due to prior checks
               throw new Error(
                  "Internal Error: Query string could not be determined.",
               );
            }

            const { result } =
               await model.getQueryResults(sourceName, undefined, queryString);

            // --- Format Success Response ---
            // Use the helper function to build valid URIs
            const baseUriComponents = {
               project: projectName,
               package: packageName,
               resourceType: "models" as const,
               resourceName: modelPath,
            };
            const queryResultUri = buildMalloyUri(baseUriComponents, "result");
            const queryResultString = JSON.stringify(result, null, 2);

            return {
               isError: false,
               content: [
                  {
                     type: "resource",
                     resource: {
                        type: "application/json",
                        uri: queryResultUri,
                        text: queryResultString,
                     },
                  },
               ],
            };
         } catch (queryError) {
            // Handle query execution errors (syntax errors, invalid queries, etc.)
            console.error(
               `[MCP Server Error] Error executing query in ${projectName}/${packageName}/${modelPath}:`,
               queryError,
            );
            const errorDetails: ErrorDetails = getMalloyErrorDetails(
               "executeQuery",
               `${projectName}/${packageName}/${modelPath}`, // Include project
               queryError,
            );

            // Format error details as structured JSON
            const errorJson = JSON.stringify(
               {
                  error: errorDetails.message,
                  suggestions: errorDetails.suggestions,
               },
               null,
               2,
            );
            return {
               isError: true,
               // Return as application/json nested inside a 'resource' type
               content: [
                  {
                     type: "resource", // Use 'resource' type
                     resource: {
                        type: "application/json", // Actual content type
                        uri: "error://executeQuery/queryExecution", // Placeholder URI
                        text: errorJson,
                     },
                  },
               ],
            };
         }
      },
   );
}
