import * as fs from "fs/promises";
import * as path from "path";

import { DuckDBConnection } from "@malloydata/db-duckdb";
import {
   Connection,
   ConnectionRuntime,
   EmptyURLReader,
   SourceDef,
} from "@malloydata/malloy";
import { metrics } from "@opentelemetry/api";
import recursive from "recursive-readdir";
import { components } from "../api";
import { API_PREFIX } from "../constants";
import { PackageNotFoundError } from "../errors";
import {
   MODEL_FILE_SUFFIX,
   NOTEBOOK_FILE_SUFFIX,
   PACKAGE_MANIFEST_NAME,
} from "../utils";
import { createConnections } from "./connection";
import { Model } from "./model";
import { Scheduler } from "./scheduler";
type ApiDatabase = components["schemas"]["Database"];
type ApiModel = components["schemas"]["Model"];
export type ApiPackage = components["schemas"]["Package"];
type ApiSchedule = components["schemas"]["Schedule"];
type ApiColumn = components["schemas"]["Column"];
type ApiTableDescription = components["schemas"]["TableDescription"];

export class Package {
   private packageName: string;
   private packageMetadata: ApiPackage;
   private databases: ApiDatabase[];
   private models: Map<string, Model> = new Map();
   private scheduler: Scheduler | undefined;
   private static meter = metrics.getMeter("publisher");
   private static packageLoadHistogram = this.meter.createHistogram(
      "malloy_package_load_duration",
      {
         description: "Time taken to load a Malloy package",
         unit: "ms",
      },
   );

   constructor(
      packageName: string,
      packageMetadata: ApiPackage,
      databases: ApiDatabase[],
      models: Map<string, Model>,
      scheduler: Scheduler | undefined,
   ) {
      this.packageName = packageName;
      this.packageMetadata = packageMetadata;
      this.databases = databases;
      this.models = models;
      this.scheduler = scheduler;
   }

   static async create(
      projectName: string,
      packageName: string,
      packagePath: string,
      projectConnections: Map<string, Connection>,
   ): Promise<Package> {
      const startTime = performance.now();
      await Package.validatePackageManifestExistsOrThrowError(packagePath);

      try {
         const packageConfig = await Package.readPackageConfig(packagePath);
         packageConfig.resource = `${API_PREFIX}/projects/${projectName}/packages/${packageName}`;

         const databases = await Package.readDatabases(packagePath);
         const connections = new Map<string, Connection>(projectConnections);

         // Package connections override project connections.
         const { malloyConnections: packageConnections } =
            await createConnections(packagePath);
         packageConnections.forEach((connection) => {
            connections.set(connection.name, connection);
         });

         // Add a duckdb connection for the package.
         connections.set(
            "duckdb",
            new DuckDBConnection("duckdb", ":memory:", packagePath),
         );

         const models = await Package.loadModels(
            packageName,
            packagePath,
            connections,
         );
         const scheduler = Scheduler.create(models);
         const endTime = performance.now();
         const executionTime = endTime - startTime;
         this.packageLoadHistogram.record(executionTime, {
            malloy_package_name: packageName,
            status: "success",
         });
         return new Package(
            packageName,
            packageConfig,
            databases,
            models,
            scheduler,
         );
      } catch (error) {
         console.error(error);
         const endTime = performance.now();
         const executionTime = endTime - startTime;
         this.packageLoadHistogram.record(executionTime, {
            malloy_package_name: packageName,
            status: "error",
         });
         throw new Error("Error loading package: " + error);
      }
   }

   public getPackageName(): string {
      return this.packageName;
   }

   public getPackageMetadata(): ApiPackage {
      return this.packageMetadata;
   }

   public listDatabases(): ApiDatabase[] {
      return this.databases;
   }

   public listSchedules(): ApiSchedule[] {
      return this.scheduler ? this.scheduler.list() : [];
   }

   public getModel(modelPath: string): Model | undefined {
      return this.models.get(modelPath);
   }

   public listModels(): ApiModel[] {
      return Array.from(this.models.keys()).map((modelPath) => {
         return {
            path: modelPath,
            type: modelPath.endsWith(MODEL_FILE_SUFFIX) ? "source" : "notebook",
         };
      });
   }

   private static async loadModels(
      packageName: string,
      packagePath: string,
      connections: Map<string, Connection>,
   ): Promise<Map<string, Model>> {
      const modelPaths = await Package.getModelPaths(packagePath);
      const models = await Promise.all(
         modelPaths.map((modelPath) =>
            Model.create(packageName, packagePath, modelPath, connections),
         ),
      );
      return new Map(models.map((model) => [model.getPath(), model]));
   }

   private static async getModelPaths(packagePath: string): Promise<string[]> {
      let files = undefined;
      try {
         files = await recursive(packagePath);
      } catch (error) {
         console.log(error);
         throw new PackageNotFoundError(
            `Package config for ${packagePath} does not exist.`,
         );
      }
      return files
         .map((fullPath: string) => {
            return path.relative(packagePath, fullPath).replace(/\\/g, "/");
         })
         .filter(
            (modelPath: string) =>
               modelPath.endsWith(MODEL_FILE_SUFFIX) ||
               modelPath.endsWith(NOTEBOOK_FILE_SUFFIX),
         );
   }

   private static async validatePackageManifestExistsOrThrowError(
      packagePath: string,
   ) {
      const packageConfigPath = path.join(packagePath, PACKAGE_MANIFEST_NAME);
      try {
         await fs.stat(packageConfigPath);
      } catch (error) {
         console.error(
            `Package manifest check failed for ${packageConfigPath}:`,
            error,
         );
         throw new PackageNotFoundError(
            `Package manifest for ${packagePath} does not exist.`,
         );
      }
   }

   private static async readPackageConfig(
      packagePath: string,
   ): Promise<ApiPackage> {
      const packageConfigPath = path.join(packagePath, PACKAGE_MANIFEST_NAME);
      const packageConfigContents = await fs.readFile(packageConfigPath);
      // TODO: Validate package manifest.  Define manifest type in public API.
      const packageManifest = JSON.parse(packageConfigContents.toString());
      return {
         name: packageManifest.name,
         description: packageManifest.description,
      };
   }

   private static async readDatabases(
      packagePath: string,
   ): Promise<ApiDatabase[]> {
      return await Promise.all(
         (await Package.getDatabasePaths(packagePath)).map(
            async (databasePath) => {
               const databaseInfo = await Package.getDatabaseInfo(
                  packagePath,
                  databasePath,
               );

               return {
                  path: databasePath,
                  info: databaseInfo,
                  type: "embedded",
               };
            },
         ),
      );
   }

   private static async getDatabasePaths(
      packagePath: string,
   ): Promise<string[]> {
      let files = undefined;
      files = await recursive(packagePath);
      return files
         .map((fullPath: string) => {
            return path.relative(packagePath, fullPath).replace(/\\/g, "/");
         })
         .filter(
            (modelPath: string) =>
               modelPath.endsWith(".parquet") || modelPath.endsWith(".csv"),
         );
   }

   private static async getDatabaseInfo(
      packagePath: string,
      databasePath: string,
   ): Promise<ApiTableDescription> {
      const fullPath = path.join(packagePath, databasePath);

      // Create a DuckDB source then:
      // 1. Load the model and get the table schema from model
      // 2. Run a query to get the row count from the table
      const runtime = new ConnectionRuntime({
         urlReader: new EmptyURLReader(),
         connections: [new DuckDBConnection("duckdb")],
      });
      const model = runtime.loadModel(
         `source: temp is duckdb.table('${fullPath}')`,
      );
      const modelDef = await model.getModel();
      const fields = (modelDef._modelDef.contents["temp"] as SourceDef).fields;
      const schema = fields.map((field): ApiColumn => {
         return { type: field.type, name: field.name };
      });
      const runner = model.loadQuery(
         "run: temp->{aggregate: row_count is count()}",
      );
      const result = await runner.run();
      const rowCount = result.data.value[0].row_count?.valueOf() as number;
      return { name: databasePath, rowCount, columns: schema };
   }
}
