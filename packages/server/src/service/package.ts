import * as fs from "fs/promises";
import * as path from "path";
import { components } from "../api";
import recursive from "recursive-readdir";
import { PackageNotFoundError } from "../errors";
import { Model } from "./model";
import {
   PACKAGE_MANIFEST_NAME,
   MODEL_FILE_SUFFIX,
   NOTEBOOK_FILE_SUFFIX,
} from "../utils";
import { Scheduler } from "./scheduler";
import { Connection } from "@malloydata/malloy";
import { createConnections } from "./connection";
import { DuckDBConnection } from "@malloydata/db-duckdb";

type ApiDatabase = components["schemas"]["Database"];
type ApiModel = components["schemas"]["Model"];
export type ApiPackage = components["schemas"]["Package"];
type ApiSchedule = components["schemas"]["Schedule"];

export class Package {
   private packageName: string;
   private packageMetadata: ApiPackage;
   private databases: ApiDatabase[];
   private models: Map<string, Model> = new Map();
   private scheduler: Scheduler | undefined;

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
      packageName: string,
      packagePath: string,
      projectConnections: Map<string, Connection>,
   ): Promise<Package> {
      // If package manifest does not exist, we throw a not found error.  If the package
      // manifest exists, we create a Package object and record errors in the object's fields.
      await Package.validatePackageManifestExistsOrThrowError(packagePath);

      try {
         const packageConfig = await Package.readPackageConfig(packagePath);
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

         const models = await Package.loadModels(packageName, packagePath, connections);
         const scheduler = Scheduler.create(models);
         return new Package(
            packageName,
            packageConfig,
            databases,
            models,
            scheduler,
         );
      } catch (error) {
         console.error(error);
         return new Package(
            packageName,
            {
               name: packageName,
               description:
                  "Unable to load package: " + (error as Error).message,
            },
            new Array<ApiDatabase>(),
            new Map<string, Model>(),
            undefined,
         );
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
         } as ApiModel;
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
            return fullPath.replace(packagePath + "/", "");
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
      const packageConfigPath = path.join(
         packagePath,
         PACKAGE_MANIFEST_NAME,
      );
      try {
         await fs.stat(packageConfigPath);
      } catch {
         throw new PackageNotFoundError(
            `Package manifest for ${packagePath} does not exist.`,
         );
      }
   }

   private static async readPackageConfig(
      packagePath: string,
   ): Promise<ApiPackage> {
      const packageConfigPath = path.join(
         packagePath,
         PACKAGE_MANIFEST_NAME,
      );
      const packageConfigContents = await fs.readFile(packageConfigPath);
      // TODO: Validate package manifest.  Define manifest type in public API.
      const packageManifest = JSON.parse(packageConfigContents.toString());
      return { name: packageManifest.name, description: packageManifest.description };
   }

   private static async readDatabases(
      packagePath: string,
   ): Promise<ApiDatabase[]> {
      return await Promise.all(
         (await Package.getDatabasePaths(packagePath)).map(
            async (databasePath) => {
               const databaseSize: number = await Package.getDatabaseSize(
                  packagePath,
                  databasePath,
               );
               return {
                  path: databasePath,
                  size: databaseSize,
                  type: "embedded",
               } as ApiDatabase;
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
            return fullPath.replace(packagePath + "/", "");
         })
         .filter((modelPath: string) => modelPath.endsWith(".parquet"));
   }

   private static async getDatabaseSize(
      packagePath: string,
      databasePath: string,
   ): Promise<number> {
      const fullPath = path.join(packagePath, databasePath);
      return (await fs.stat(fullPath)).size;
   }
}
