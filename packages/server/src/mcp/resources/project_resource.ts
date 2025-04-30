import {
   McpServer,
   ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ListResourcesResult } from "@modelcontextprotocol/sdk/types.js"; // Needed for list return type
import { ProjectStore } from "../../service/project_store";
import { handleResourceGet, McpGetResourceError } from "../handler_utils";
import { RESOURCE_METADATA } from "../resource_metadata";
import { getInternalError, getNotFoundError } from "../error_messages"; // Needed for error handling in list AND get

// Define an interface for the package object augmented with project name
interface PackageWithProject {
   name?: string;
   // Add other relevant package properties if needed
   projectName: string;
}

/**
 * Registers the Malloy Project resource type with the MCP server.
 * Handles getting details for the hardcoded 'home' project and listing packages within it.
 */
export function registerProjectResource(
   mcpServer: McpServer,
   projectStore: ProjectStore,
): void {
   mcpServer.resource(
      "project",
      new ResourceTemplate("malloy://project/{projectName}", {
         /**
          * Handles ListResources requests.
          * If projectName is specified, lists packages for that project (only 'home' supported).
          * If projectName is not specified (general ListResources call), lists packages for the default 'home' project.
          */
         list: async (/* extra: ListProjectExtra - Deleted */): Promise<ListResourcesResult> => {
            console.log(
               "[MCP LOG] Entering ListResources (project) handler (listing ALL packages)...",
            );
            // Ignore parameters from 'extra' as URI path params aren't passed to list handlers.

            try {
               const allProjects = await projectStore.listProjects();
               console.log(
                  `[MCP LOG] Found ${allProjects.length} projects defined.`,
               );

               const packagePromises = allProjects.map(async (proj) => {
                  try {
                     console.log(
                        `[MCP LOG] Getting project '${proj.name}' to list its packages...`,
                     );
                     const projectInstance = await projectStore.getProject(
                        proj.name!,
                        false,
                     ); // Use proj.name
                     const packages = await projectInstance.listPackages();
                     console.log(
                        `[MCP LOG] Found ${packages.length} packages in project '${proj.name}'.`,
                     );
                     // Return packages along with their project name for URI construction
                     return packages.map((pkg) => ({
                        ...pkg,
                        projectName: proj.name,
                     }));
                  } catch (projectError) {
                     console.error(
                        `[MCP Server Error] Error getting/listing packages for project ${proj.name}:`,
                        projectError,
                     );
                     return []; // Return empty array for this project on error
                  }
               });

               const results = await Promise.allSettled(packagePromises);
               const allPackagesWithProjectName = results
                  .filter((result) => result.status === "fulfilled")
                  // Use the specific interface instead of any[]
                  .flatMap(
                     (result) =>
                        (result as PromiseFulfilledResult<PackageWithProject[]>)
                           .value,
                  );

               console.log(
                  `[MCP LOG] Total packages found across all projects: ${allPackagesWithProjectName.length}`,
               );

               const packageMetadata = RESOURCE_METADATA.package;
               const mappedResources = allPackagesWithProjectName.map((pkg) => {
                  const name = pkg.name || "unknown";
                  // Construct URI using the package's specific projectName
                  const uri = `malloy://project/${pkg.projectName}/package/${name}`;
                  return {
                     uri: uri,
                     name: name,
                     type: "package",
                     description: packageMetadata?.description as
                        | string
                        | undefined,
                     metadata: packageMetadata,
                  };
               });

               console.log(
                  `[MCP LOG] ListResources (project): Returning ${mappedResources.length} package resources.`,
               );
               return {
                  resources: mappedResources,
               };
            } catch (error) {
               // Catch errors from projectStore.listProjects() itself
               console.error(
                  `[MCP Server Error] Error listing projects:`,
                  error,
               );
               const errorDetails = getInternalError(
                  `ListResources (project - initial list)`,
                  error,
               );
               console.error(
                  "MCP ListResources (project) error:",
                  errorDetails.message,
               );
               console.log(
                  "[MCP LOG] ListResources (project): Returning empty on error listing projects.",
               );
               return { resources: [] };
            }
         },
      }),
      /** Handles GetResource requests for Malloy Projects */
      (uri, params) =>
         handleResourceGet(
            uri,
            params,
            "project",
            async ({ projectName }: { projectName?: unknown }) => {
               console.log(
                  `[MCP LOG] Entering GetResource (project) handler for projectName: ${projectName}`,
               );
               // Validate project name parameter
               if (typeof projectName !== "string") {
                  console.error(
                     "[MCP LOG] GetResource (project): Invalid project name param.",
                  );
                  throw new Error("Invalid project name parameter.");
               }

               try {
                  console.log(
                     `[MCP LOG] GetResource: Getting project '${projectName}'...`,
                  );
                  // Get the project instance, but we might not need its metadata directly
                  await projectStore.getProject(projectName, false);
                  // Construct the definition object expected by the test
                  const definition = { name: projectName };
                  console.log(
                     `[MCP LOG] GetResource (project): Returning definition for '${projectName}'.`,
                  );
                  // Return the explicit definition structure
                  return definition;
               } catch (error) {
                  console.error(
                     `[MCP LOG] GetResource (project): Error caught for '${projectName}':`,
                     error,
                  );
                  // Catch expected errors from this specific resource logic
                  if (error instanceof Error) {
                     // Use getNotFoundError for the specific project not found case
                     // or a generic message for the invalid param case.
                     const errorDetails = getNotFoundError(
                        error.message.includes("not found")
                           ? `Project '${projectName}'` // More specific context
                           : `Invalid project identifier provided for URI ${uri.href}`, // Generic but informative
                     );
                     // Re-throw structured error for handleResourceGet to catch
                     throw new McpGetResourceError(errorDetails);
                  }
                  // Re-throw unexpected errors to be caught by handleResourceGet's generic handler
                  throw error;
               }
            },
            RESOURCE_METADATA.project,
         ),
   );
}
