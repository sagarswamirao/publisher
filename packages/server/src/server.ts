import express from "express";
import * as http from "http";
import { AddressInfo } from "net";
import * as path from "path";
import morgan from "morgan";
import * as bodyParser from "body-parser";
import cors from "cors";
import { internalErrorToHttpError, NotImplementedError } from "./errors";
import { ProjectStore } from "./service/project_store";
import { initializeMcpServer } from "./mcp/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { DatabaseController } from "./controller/database.controller";
import { ModelController } from "./controller/model.controller";
import { PackageController } from "./controller/package.controller";
import { QueryController } from "./controller/query.controller";
import { ScheduleController } from "./controller/schedule.controller";
import { ConnectionController } from "./controller/connection.controller";

const PUBLISHER_PORT = Number(process.env.PUBLISHER_PORT || 4000);
const PUBLISHER_HOST = process.env.PUBLISHER_HOST || "localhost";
const MCP_PORT = Number(process.env.MCP_PORT || 4001);
const MCP_ENDPOINT = "/mcp";
const ROOT = path.join(__dirname, "../../app/dist/");
const SERVER_ROOT = path.resolve(process.cwd(), process.env.SERVER_ROOT || ".");
const API_PREFIX = "/api/v0";

const app = express();
app.use(morgan("tiny"));

const projectStore = new ProjectStore(SERVER_ROOT);
const connectionController = new ConnectionController(projectStore);
const modelController = new ModelController(projectStore);
const packageController = new PackageController(projectStore);
const databaseController = new DatabaseController(projectStore);
const queryController = new QueryController(projectStore);
const scheduleController = new ScheduleController(projectStore);

const mcpApp = express();

mcpApp.use(MCP_ENDPOINT, express.json());
mcpApp.use(MCP_ENDPOINT, cors());

mcpApp.all(MCP_ENDPOINT, async (req, res) => {
   console.log(`[MCP Debug] Handling ${req.method} (Stateless)`);

   try {
      if (req.method === "POST") {
         const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
         });

         transport.onclose = () => {
            console.log(
               `[MCP Transport Info] Stateless transport closed for a request.`,
            );
         };
         transport.onerror = (err: Error) => {
            console.error(
               `[MCP Transport Error] Stateless transport error:`,
               err,
            );
         };

         const requestMcpServer = initializeMcpServer(projectStore);
         await requestMcpServer.connect(transport);

         res.on("close", () => {
            console.log(
               "[MCP Transport Info] Response closed, cleaning up stateless transport.",
            );
            transport.close().catch((err) => {
               console.error(
                  "[MCP Transport Error] Error closing stateless transport on response close:",
                  err,
               );
            });
         });

         await transport.handleRequest(req, res, req.body);
      } else if (req.method === "GET" || req.method === "DELETE") {
         console.warn(
            `[MCP Transport Warn] Method Not Allowed in Stateless Mode: ${req.method}`,
         );
         res.setHeader("Allow", "POST");
         res.status(405).json({
            jsonrpc: "2.0",
            error: {
               code: -32601,
               message: "Method Not Allowed in Stateless Mode",
            },
            id: null,
         });
         return;
      } else {
         console.warn(`[MCP Transport Warn] Method Not Allowed: ${req.method}`);
         res.setHeader("Allow", "POST");
         res.status(405).json({
            jsonrpc: "2.0",
            error: { code: -32601, message: "Method Not Allowed" },
            id: null,
         });
         return;
      }
   } catch (error) {
      console.error(
         `[MCP Transport Error] Unhandled error in ${req.method} handler (Stateless):`,
         error,
      );
      if (!res.headersSent) {
         res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id:
               typeof req.body === "object" &&
               req.body !== null &&
               "id" in req.body
                  ? req.body.id
                  : null,
         });
      }
   }
});

app.use("/", express.static(path.join(ROOT, "/")));
app.use("/api-doc.html", express.static(path.join(ROOT, "/api-doc.html")));

const setVersionIdError = (res: express.Response) => {
   const { json, status } = internalErrorToHttpError(
      new NotImplementedError("Version IDs not implemented."),
   );
   res.status(status).json(json);
};

app.use(cors());
app.use(bodyParser.json());

app.get(`${API_PREFIX}/projects`, async (_req, res) => {
   try {
      res.status(200).json(await projectStore.listProjects());
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName`, async (req, res) => {
   try {
      const project = await projectStore.getProject(
         req.params.projectName,
         !!req.query.reload,
      );
      res.status(200).json(await project.getProjectMetadata());
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections`, async (req, res) => {
   try {
      res.status(200).json(
         await connectionController.listConnections(req.params.projectName),
      );
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.getConnection(
               req.params.projectName,
               req.params.connectionName,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName/test`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.testConnection(
               req.params.projectName,
               req.params.connectionName,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName/sqlSource`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.getConnectionSqlSource(
               req.params.projectName,
               req.params.connectionName,
               req.query.sqlStatement as string,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName/tableSource`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.getConnectionTableSource(
               req.params.projectName,
               req.params.connectionName,
               req.query.tableKey as string,
               req.query.tablePath as string,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName/queryData`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.getConnectionQueryData(
               req.params.projectName,
               req.params.connectionName,
               req.query.sqlStatement as string,
               req.query.options as string,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/connections/:connectionName/temporaryTable`,
   async (req, res) => {
      try {
         res.status(200).json(
            await connectionController.getConnectionTemporaryTable(
               req.params.projectName,
               req.params.connectionName,
               req.query.sqlStatement as string,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(`${API_PREFIX}/projects/:projectName/packages`, async (req, res) => {
   if (req.query.versionId) {
      setVersionIdError(res);
      return;
   }

   try {
      res.status(200).json(
         await packageController.listPackages(req.params.projectName),
      );
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         res.status(200).json(
            await packageController.getPackage(
               req.params.projectName,
               req.params.packageName,
               !!req.query.reload,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName/models`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         res.status(200).json(
            await modelController.listModels(
               req.params.projectName,
               req.params.packageName,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName/models/*?`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         const zero = 0 as unknown;
         res.status(200).json(
            await modelController.getModel(
               req.params.projectName,
               req.params.packageName,
               req.params[zero as keyof typeof req.params],
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName/queryResults/*?`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         const zero = 0 as unknown;
         res.status(200).json(
            await queryController.getQuery(
               req.params.projectName,
               req.params.packageName,
               req.params[zero as keyof typeof req.params],
               req.query.sourceName as string,
               req.query.queryName as string,
               req.query.query as string,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName/schedules`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         res.status(200).json(
            await scheduleController.listSchedules(
               req.params.projectName,
               req.params.packageName,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get(
   `${API_PREFIX}/projects/:projectName/packages/:packageName/databases`,
   async (req, res) => {
      if (req.query.versionId) {
         setVersionIdError(res);
         return;
      }

      try {
         res.status(200).json(
            await databaseController.listDatabases(
               req.params.projectName,
               req.params.packageName,
            ),
         );
      } catch (error) {
         console.error(error);
         const { json, status } = internalErrorToHttpError(error as Error);
         res.status(status).json(json);
      }
   },
);

app.get("*", (_req, res) => res.sendFile(path.resolve(ROOT, "index.html")));

app.use((err: Error, _req: express.Request, res: express.Response) => {
   console.error("Unhandled error:", err);
   const { json, status } = internalErrorToHttpError(err);
   res.status(status).json(json);
});

const mainServer = http.createServer(app);
mainServer.listen(PUBLISHER_PORT, PUBLISHER_HOST, () => {
   const address = mainServer.address() as AddressInfo;
   console.log(
      `Publisher server listening at http://${address.address}:${address.port}`,
   );
});

const mcpHttpServer = mcpApp.listen(MCP_PORT, PUBLISHER_HOST, () => {
   console.log(`MCP server listening at http://${PUBLISHER_HOST}:${MCP_PORT}`);
});

export { mainServer as httpServer, mcpHttpServer, app, mcpApp };
