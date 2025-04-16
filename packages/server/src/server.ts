import express from "express";
import * as http from "http";
import { AddressInfo } from "net";
import * as path from "path";
import morgan from "morgan";
import * as bodyParser from "body-parser";
import { DatabaseController } from "./controller/database.controller";
import { ModelController } from "./controller/model.controller";
import { PackageController } from "./controller/package.controller";
import { QueryController } from "./controller/query.controller";
import { ScheduleController } from "./controller/schedule.controller";
import cors from "cors";
import { internalErrorToHttpError, NotImplementedError } from "./errors";
import { ConnectionController } from "./controller/connection.controller";
import { ProjectStore } from "./service/project_store";
const app = express();
app.use(morgan("tiny"));

const PUBLISHER_PORT = Number(process.env.PUBLISHER_PORT || 4000);
const PUBLISHER_HOST = process.env.PUBLISHER_HOST || "localhost";
const ROOT = path.join(__dirname, "../../app/dist/");
const API_PREFIX = "/api/v0";
const SERVER_ROOT = path.resolve(
   process.cwd(),
   process.env.PACKAGE_ROOT || ".",
);

const projectStore = new ProjectStore(SERVER_ROOT);
const connectionController = new ConnectionController(projectStore);
const modelController = new ModelController(projectStore);
const packageController = new PackageController(projectStore);
const databaseController = new DatabaseController(projectStore);
const queryController = new QueryController(projectStore);
const scheduleController = new ScheduleController(projectStore);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use("/", express.static(path.join(ROOT, "/")));
app.use("/api-doc.html", express.static(path.join(ROOT, "/api-doc.html")));

const setVersionIdError = (res: express.Response) => {
   const { json, status } = internalErrorToHttpError(
      new NotImplementedError("Version IDs not implemented."),
   );
   res.status(status).json(json);
};

app.get(`${API_PREFIX}/projects`, async (_req, res) => {
   try {
      res.status(200).json(await projectStore.listProjects());
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/about`, async (req, res) => {
   try {
      const project = await projectStore.getProject(req.params.projectName);
      res.status(200).json(await project.getAbout());
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.listConnections(req.params.projectName));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.getConnection(
         req.params.projectName,
         req.params.connectionName,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName/test`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.testConnection(
         req.params.projectName,
         req.params.connectionName,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName/sqlSource`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.getConnectionSqlSource(
         req.params.projectName,
         req.params.connectionName,
         req.query.sqlStatement as string,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName/tableSource`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.getConnectionTableSource(
         req.params.projectName,
         req.params.connectionName,
         req.query.tableKey as string,
         req.query.tablePath as string,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName/queryData`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.getConnectionQueryData(
         req.params.projectName,
         req.params.connectionName,
         req.query.sqlStatement as string,
         req.query.options as string,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/connections/:connectionName/temporaryTable`, async (req, res) => {
   try {
      res.status(200).json(await connectionController.getConnectionTemporaryTable(
         req.params.projectName,
         req.params.connectionName,
         req.query.sqlStatement as string,
      ));
   } catch (error) {
      console.error(error);
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/projects/:projectName/packages`, async (req, res) => {
   if (req.query.versionId) {
      setVersionIdError(res);
      return;
   }

   try {
      res.status(200).json(await packageController.listPackages(req.params.projectName));
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
         // Need to do some fancy typing to prevent typescript from complaning about indexing params with 0.
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
         // Need to do some fancy typing to prevent typescript from complaning about indexing params with 0.
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

const server = http.createServer(app);
server.listen(PUBLISHER_PORT, PUBLISHER_HOST, () => {
   const address = server.address() as AddressInfo;
   console.log(
      `Server is running at http://${address.address}:${address.port}`,
   );
});
