import express from "express";
import * as http from "http";
import { AddressInfo } from "net";
import * as path from "path";
import morgan from "morgan";
import * as bodyParser from "body-parser";
import { AboutController } from "./controller/about.controller";
import { DatabaseController } from "./controller/database.controller";
import { ModelController } from "./controller/model.controller";
import { PackageController } from "./controller/package.controller";
import { QueryController } from "./controller/query.controller";
import { ScheduleController } from "./controller/schedule.controller";
import { getWorkingDirectory } from "./utils";
import cors from "cors";
import * as fs from "fs";
import { internalErrorToHttpError, NotImplementedError } from "./errors";
import { PackageService } from "./service/package.service";

const app = express();
app.use(morgan("tiny"));

const PUBLISHER_PORT = Number(process.env.PUBLISHER_PORT || 4000);
const PUBLISHER_HOST = process.env.PUBLISHER_HOST || "localhost";
const ROOT = path.join(__dirname, "../../app/dist/");
const API_PREFIX = "/api/v0";
const VERSION_ID_HEADER = "X-Version-Id";

const packageService = new PackageService();
const aboutController = new AboutController();
const modelController = new ModelController(packageService);
const packageController = new PackageController(packageService);
const databaseController = new DatabaseController(packageService);
const queryController = new QueryController(packageService);
const scheduleController = new ScheduleController(packageService);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use("/", express.static(path.join(ROOT, "/")));
app.use("/api-doc.html", express.static(path.join(ROOT, "/api-doc.html")));

// Validate working directory exists or throw an error and fail to startup.
if (!fs.existsSync(getWorkingDirectory())) {
   throw Error(
      "Server working directory does not exist: " + getWorkingDirectory(),
   );
}

app.get(`${API_PREFIX}/about`, async (_req, res) => {
   try {
      res.status(200).json(await aboutController.getAbout());
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      res.status(200).json(await packageController.listPackages());
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:name`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      res.status(200).json(await packageController.getPackage(req.params.name));
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:name/models`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      res.status(200).json(await modelController.listModels(req.params.name));
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:name/models/*?`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      // Need to do some fancy typing to prevent typescript from complaning about indexing params with 0.
      const zero = 0 as unknown;
      res.status(200).json(
         await modelController.getModel(
            req.params.name,
            req.params[zero as keyof typeof req.params],
         ),
      );
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:id/queryResults/*?`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      // Need to do some fancy typing to prevent typescript from complaning about indexing params with 0.
      const zero = 0 as unknown;
      res.status(200).json(
         await queryController.getQuery(
            req.params.id,
            req.params[zero as keyof typeof req.params],
            req.query.sourceName as string,
            req.query.queryName as string,
            req.query.query as string,
         ),
      );
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:id/schedules`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      res.status(200).json(
         await scheduleController.listSchedules(req.params.id),
      );
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get(`${API_PREFIX}/packages/:id/databases`, async (req, res) => {
   if (req.header(VERSION_ID_HEADER)) {
      const { json, status } = internalErrorToHttpError(
         new NotImplementedError("Version IDs not implemented."),
      );
      res.status(status).json(json);
      return;
   }

   try {
      res.status(200).json(
         await databaseController.listDatabases(req.params.id),
      );
   } catch (error) {
      const { json, status } = internalErrorToHttpError(error as Error);
      res.status(status).json(json);
   }
});

app.get("*", (_req, res) => res.sendFile(path.resolve(ROOT, "index.html")));

const server = http.createServer(app);
server.listen(PUBLISHER_PORT, PUBLISHER_HOST, () => {
   const address = server.address() as AddressInfo;
   console.log(
      `Server is running at http://${address.address}:${address.port}`,
   );
});
