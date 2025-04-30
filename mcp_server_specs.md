# MCP SSE Endpoint Implementation Plan

## Goal

Add a Model Context Protocol (MCP) endpoint to the Malloy Publisher server (`packages/server`) adhering to the MCP specification and using the official TypeScript SDK. This endpoint will allow MCP clients (like AI agents) to:

1.  Discover Malloy resources (projects, packages, models, sources, views, notebooks) via MCP Resource requests.
2.  Execute existing and ad-hoc Malloy queries via an MCP Tool.
3.  Receive query results in JSON format.

The implementation reuses existing logic from the REST API where possible and provides verbose documentation and user-friendly errors suitable for AI agent consumption. No authentication is implemented, matching the REST API.

## Development Approach

*   **Test-Driven Development (TDD):** Functional/integration tests were written to guide implementation.
*   **Testing Framework:** The project uses Bun's built-in test runner (`bun test`) with its Jest-compatible API (`bun:test`).
*   **Test Location:** MCP-specific tests are located in `packages/server/src/__tests__/` (e.g., `mcp_transport.integration.spec.ts`, `mcp_resource.integration.spec.ts`, `mcp_execute_query_tool.integration.spec.ts`).
*   **Test Execution:** Tests are run by explicitly targeting the files or directory: `bun test packages/server/src/__tests__/mcp_`
*   **Code Quality:** Adhered to existing ESLint and Prettier configurations.

## MCP Overview

*   **Standard:** Model Context Protocol ([https://modelcontextprotocol.io/](https://modelcontextprotocol.io/))
*   **SDK:** `@modelcontextprotocol/sdk` (TypeScript)
*   **Communication:** JSON-RPC 2.0
*   **Transport:** Uses `@modelcontextprotocol/sdk/server/streamableHttp.js` (`StreamableHttpServerTransport`), handling JSON-RPC 2.0 requests via HTTP POST and Server-Sent Events (SSE) for responses/notifications.
*   **Endpoint:** The MCP server runs as a separate Express app instance (`mcpApp`) listening on a dedicated port (default: 4001, configurable via `MCP_PORT` environment variable) at the path `/mcp`. It listens on the host specified by `PUBLISHER_HOST` (default: `localhost`).

## Implementation Summary

1.  **Setup & Dependencies:** (Completed)
    *   Added `@modelcontextprotocol/sdk`.
    *   Confirmed framework is Express.
    *   Confirmed no existing authentication.
    *   Added `bun-types`.

2.  **MCP Server Initialization:** (Completed)
    *   Created `packages/server/src/mcp/`.
    *   Implemented `initializeMcpServer` in `src/mcp/server.ts` (this now coordinates registration functions imported from resource/tool modules).
    *   Integrated initialization into `src/server.ts` startup.
    *   Verified with initialization tests (`mcp_server_init.spec.ts` - now optional).

3.  **HTTP/SSE Transport Implementation:** (Completed)
    *   Created a separate Express app (`mcpApp`) for MCP on `MCP_PORT`.
    *   Applied `cors()` and `express.json()` middleware specific to the `/mcp` route.
    *   Implemented a handler (`mcpApp.all('/mcp', ...)`) in `src/server.ts` operating in **stateless mode**:
        *   **POST:** For every POST request, creates a new `StreamableHttpServerTransport` instance with `sessionIdGenerator: undefined`. It initializes the MCP server logic by calling `initializeMcpServer(projectStore)`, connects the transport to this server logic, handles the incoming request via `transport.handleRequest`, and sets up a `res.on('close')` handler to call `transport.close()` when the request/response cycle finishes.
        *   **GET / DELETE:** Returns 405 Method Not Allowed, as these methods are not used in stateless operation.
        *   **No Session State:** Does not maintain a server-side map of transports or validate session IDs.
    *   Verified relevant parts with transport tests (`mcp_transport.integration.spec.ts`), noting that session-specific tests are no longer applicable.

4.  **Expose Malloy Resources via MCP:** (Completed)
    *   Defined MCP resource schemas (Project, Package, Model, Source, View, Query, Notebook) using `malloy://` URIs.
    *   Implemented MCP request handlers (`mcp/ListResources`, `mcp/GetResource`) reusing `PackageService` logic, placing each resource's logic in separate files within `packages/server/src/mcp/resources/`.
    *   Implemented `ListResources` specifically for the `Project` resource template to list packages across all known projects. Removed previous general `ListResources` handler.
    *   **Specific Package Resource Implementations:**
        *   `malloy://.../package/{packageName}`: Handles `GetResource` via the `handleResourceGet` utility to return package metadata.
        *   `malloy://.../package/{packageName}/contents`: Handles `GetResource` via a *custom handler* (not `handleResourceGet`) to return a direct `application/json` response containing an array of `{ uri, metadata }` for resources within the package.
    *   Formatted standard `GetResource` responses (via `handleResourceGet`) to include `definition` and `metadata` (from `resource_metadata.ts`).
    *   Verified with resource tests (`mcp_resource.integration.spec.ts`), including tests for package definition and contents endpoints.

5.  **Expose Malloy Query Execution as MCP Tool:** (Completed)
    *   Defined MCP tool schema `malloy/executeQuery` using Zod.
    *   Parameters: `projectName`, `packageName`, `modelPath`, `query` (optional), `sourceName` (optional), `queryName` (optional).
    *   Implemented the tool handler reusing `PackageService` logic in `packages/server/src/mcp/tools/execute_query_tool.ts`.
    *   Returns three `application/json` resource blocks on success.
    *   Tool description updated in `src/mcp/server.ts`.
    *   Verified with tool tests (`mcp_execute_query_tool.integration.spec.ts`).

6.  **Error Handling Refinement:** (Completed)
    *   Identified common error types (`PackageNotFoundError`, `ModelNotFoundError`, `ModelCompilationError`, etc.).
    *   Implemented specific error handling functions (`getNotFoundError`, `getMalloyErrorDetails`, `getInternalError`) in `error_messages.ts` providing user-friendly messages and suggestions, including parsing context from the resource URI/string.
    *   Refactored resource/tool handlers to use `McpGetResourceError` wrapper for application errors.
    *   Distinguished error handling based on type and context:
        *   **Protocol Errors (Invalid JSON/RPC):** Handled by transport bridge (`server.ts:/mcp`), returning immediate HTTP 400.
        *   **Protocol Errors (Invalid Tool Params - e.g., missing `modelPath`):** Handled by SDK/Zod schema validation *before* handler runs. Client promise is **rejected** with `InvalidParams` error.
        *   **Protocol Errors (Invalid Tool Params - e.g., conflicting `query`/`queryName`):** Handled by explicit checks *within* the `executeQuery` handler throwing `McpError`. Transport bridge catches this and returns `200 OK` + JSON-RPC error payload. Client promise **resolves** with `{ isError: true, content: [...] }` containing the error message (typically simple text).
        *   **Application Errors (e.g., Resource Not Found, Compilation Error):** Handled within resource/tool handlers. Client promise **resolves** with `{ isError: true, content: [...] }`.
             *   For `GetResource`: `content` contains structured JSON error `{ error: "...", suggestions: [...] }`.
             *   For `executeQuery`: `content` contains a single `type: "resource"` block where the resource itself has `type: "application/json"` and its `text` contains the structured JSON error `{ error: "...", suggestions: [...] }`.
    *   Enhanced tests to cover specific error mapping scenarios and message content.

7.  **Testing:** (Completed)
    *   Reviewed and refined test coverage in `src/__tests__/` for MCP functionality.
    *   Ensured relevant tests pass, ignoring known unrelated failures in `malloy-samples`.

8.  **Documentation:** (Completed)
    *   Update this document (`mcp_server_specs.md`).
    *   Update `README.md` with MCP endpoint details.

## Decisions & Considerations

*   Used official MCP standard and TypeScript SDK.
*   Implemented HTTP POST / SSE transport using Express and `@modelcontextprotocol/sdk/server/streamableHttp.js` in **stateless mode** (`sessionIdGenerator: undefined`).
*   Used a separate Express app instance (`mcpApp`) for MCP endpoints on a dedicated port (`MCP_PORT`, default 4001) at `/mcp` path, listening on `PUBLISHER_HOST` (default: `localhost`).
*   **Refactoring:** Split MCP resource and tool handlers into separate files (`packages/server/src/mcp/resources/*`, `packages/server/src/mcp/tools/*`) for better organization and maintainability. Handlers mostly use a common `handleResourceGet` utility, except for the package contents resource (`.../contents`) which required a custom handler due to its specific response format.
*   Focused on JSON output for resources and query results.
*   Reused existing `PackageService` logic.
*   No authentication implemented for MCP endpoint, matching REST API.
*   **Logging:** Decided to use standard `console.log`/`console.error` for consistency with the rest of the server, rather than introducing structured logging only for MCP.
*   **Configuration:** Deferred making the project name ('home') configurable due to complexity beyond a minor refactor.
*   Prioritized verbose, AI-friendly documentation (in resource/tool metadata) and error messages (via `error_messages.ts`).
*   Progress reporting (`$/progress`) not implemented.

### Responsibilities & Testing Scope

To ensure efficient development and avoid redundant testing, the responsibilities are clearly divided between our MCP bridge implementation (`server.ts:/mcp` handler) and the MCP SDK (`@modelcontextprotocol/sdk`):

**MCP SDK (`StreamableHTTPServerTransport`) Responsibilities (Assumed Correct & Not Tested Here):**

*   **HTTP Request Handling:** Correctly handling GET, POST, DELETE verbs according to the Streamable HTTP spec.
*   **SSE Stream Management:** Establishing, managing, formatting messages for, and closing Server-Sent Event streams.
*   **JSON-RPC Compliance:** Parsing incoming JSON-RPC messages and formatting outgoing ones.
*   **Protocol Adherence:** Enforcing protocol rules like required headers (`Accept`, `Content-Type`, `Mcp-Session-Id` where applicable) and request formats.
*   **Internal Session State:** Managing the internal state associated with a session within the transport instance.
*   **SDK Cleanup:** Performing necessary internal cleanup when its `close()` method is called (triggered by `DELETE /mcp` or potentially other events).
*   **Basic Error Handling:** Returning standard JSON-RPC errors for protocol violations it detects (e.g., parse errors, invalid request structure, Zod schema validation failures).

**Our MCP Bridge (`server.ts:/mcp` handler) & Server Initialization (`mcp/server.ts`) Responsibilities (Focus of Integration Testing - Stateless):**

*   **Server Logic Initialization:** Correctly calling `initializeMcpServer` (from `mcp/server.ts`) *for each POST request*.
*   **Transport Instantiation:** Correctly creating new `StreamableHTTPServerTransport` instances with `sessionIdGenerator: undefined` for each POST request.
*   **Request Routing & Handling:** Correctly delegating POST requests to `transport.handleRequest`. Correctly returning 405 for GET/DELETE.
*   **Server Logic Connection:** Ensuring the configured MCP server logic (from `initializeMcpServer`) is correctly connected to the per-request transport instance.
*   **Transport Cleanup:** Correctly calling `transport.close()` within the `res.on('close')` handler for POST requests.
*   **Bridge-Level Errors:** Handling errors specific to the bridge logic (e.g., method not allowed) in `server.ts`.
*   **Application Logic:** Implementing the resource (`mcp/resources/*`) and tool (`mcp/tools/*`) handlers, including interaction with `ProjectStore` and formatting results/errors correctly.

**Testing Assumptions:**

*   We assume that clients connecting to the MCP endpoint adhere to the Model Context Protocol specification.
*   Integration tests (`mcp_transport.integration.spec.ts`) focus on verifying the responsibilities of *our* bridge code (`server.ts:/mcp`) and its interaction with the `McpServer` instance, not the internal correctness of the SDK's transport implementation. (Note: This includes verifying our bridge correctly handles session cleanup via the `onclose` event triggered by the SDK transport).
*   Resource/Tool integration tests (`mcp_resource.integration.spec.ts`, `mcp_execute_query_tool.integration.spec.ts`) verify the correctness of *our* handler logic, including parameter handling, `PackageService` interaction, result formatting, and application error handling.
*   Concurrency tests focus on ensuring *our underlying application code* (`PackageService`, resource/tool handlers) handles concurrent invocations correctly when called via the MCP layer.

## Implementation Challenges and Solutions

1.  **Middleware Interference:**
    *   **Problem:** Global Express middleware interfered with SDK transport requirements.
    *   **Solution:** Created a separate Express app (`mcpApp`) for MCP without shared middleware.
2.  **Transport Configuration:**
    *   **Approach:** Relied on the SDK's `StreamableHttpServerTransport` to handle transport specifics.
    *   **Implementation:** Built a bridge handler (`mcpApp.all('/mcp', ...)` in `server.ts`) to manage sessions and route requests to the correct transport instance connected to the central `McpServer`.
3.  **Error Handling Semantics (Protocol vs. Application):**
    *   **Problem:** Distinguishing between errors the client promise should *reject* on vs. errors it should *resolve* on (with `isError: true`).
    *   **Solution:** Aligned with MCP spec and SDK behavior:
        *   **Rejection:** Promise rejects on fundamental protocol issues caught by the SDK *before* the handler runs (e.g., invalid JSON-RPC, invalid session ID, Zod schema validation failure like missing required parameters).
        *   **Resolution (isError: true):** Promise resolves with `isError: true` for:
            *   Explicit `McpError` thrown within a handler (e.g., for conflicting parameters checked by our logic). The transport bridge catches this and returns a standard JSON-RPC error payload (`200 OK` response). Content is typically simple text.
            *   Application errors (resource not found, compilation errors) caught within handlers and wrapped in `McpGetResourceError` (for `GetResource`) or handled directly (for `executeQuery`). The `handleResourceGet` utility ensures `GetResource` errors are formatted as structured JSON (`{ error: ..., suggestions: ... }`). The `executeQuery` handler ensures its application errors are formatted as structured JSON nested within a single `application/json` resource block in the resolved content (`200 OK` response). 