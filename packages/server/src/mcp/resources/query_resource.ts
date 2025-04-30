import {
   McpServer,
   ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectStore } from "../../service/project_store";
import { ModelCompilationError } from "../../errors";
import {
   handleResourceGet,
   McpGetResourceError,
   getModelForQuery,
} from "../handler_utils";
import { RESOURCE_METADATA } from "../resource_metadata";
import {
   getNotFoundError,
   getMalloyErrorDetails,
   getInternalError,
} from "../error_messages";
import type { components } from "../../api"; // Need this for Query definition type
import { URL } from "url";

// Define the expected parameter types
type QueryParams = {
   projectName?: unknown;
   packageName?: unknown;
   modelPath?: unknown;
   queryName?: unknown;
};

/**
 * Registers the Malloy Query resource type (nested within a Model).
 */
export function registerQueryResource(
   mcpServer: McpServer,
   projectStore: ProjectStore,
): void {
   mcpServer.resource(
      "query",
      new ResourceTemplate(
         "malloy://project/{projectName}/package/{packageName}/models/{modelPath}/queries/{queryName}",
         { list: undefined }, // Listing queries is not supported via this template
      ),
      (uri, params) =>
         handleResourceGet(
            uri,
            params as QueryParams,
            "query",
            async (
               { projectName, packageName, modelPath, queryName }: QueryParams,
               uri: URL,
            ) => {
               if (
                  typeof projectName !== "string" ||
                  typeof packageName !== "string" ||
                  typeof modelPath !== "string" ||
                  typeof queryName !== "string"
               ) {
                  throw new Error("Invalid parameters for query resource.");
               }

               try {
                  const modelResult = await getModelForQuery(
                     projectStore,
                     projectName,
                     packageName,
                     modelPath,
                  );
                  if ("error" in modelResult) {
                     throw new McpGetResourceError(modelResult.error);
                  }
                  const { model } = modelResult;

                  // Attempt to get the query definition from the model
                  const queries = await model.getQueries(); // Assuming this method exists
                  if (!queries) {
                     throw new Error("Could not retrieve queries from model.");
                  }
                  const query = queries.find(
                     (q: components["schemas"]["Query"]) =>
                        q.name === queryName,
                  );

                  if (!query) {
                     // Specific "Query not found" error
                     const errorDetails = getNotFoundError(
                        `Query '${queryName}' in model '${modelPath}' package '${packageName}' project '${projectName}'`,
                     );
                     throw new McpGetResourceError(errorDetails);
                  }
                  return query;
               } catch (error) {
                  if (error instanceof McpGetResourceError) {
                     throw error; // Re-throw already formatted
                  }
                  if (error instanceof ModelCompilationError) {
                     const errorDetails = getMalloyErrorDetails(
                        "GetResource (query - model compilation)",
                        `${projectName}/${packageName}/${modelPath}`,
                        error,
                     );
                     throw new McpGetResourceError(errorDetails);
                  }
                  console.error(
                     `[MCP Server Error] Error fetching query '${queryName}' from ${uri.href}:`,
                     error,
                  );
                  const fallbackErrorDetails = getInternalError(
                     `GetResource (query: ${uri.href})`,
                     error,
                  );
                  throw new McpGetResourceError(fallbackErrorDetails);
               }
            },
            RESOURCE_METADATA.query,
         ),
   );
}
