import { BaseConnection } from "@malloydata/malloy/connection";
import { Mutex } from "async-mutex";
import * as fs from "fs";
import * as path from "path";
import { components } from "../api";
import { API_PREFIX, PACKAGE_MANIFEST_NAME, README_NAME } from "../constants";
import {
   ConnectionNotFoundError,
   PackageNotFoundError,
   ProjectNotFoundError,
} from "../errors";
import { logger } from "../logger";
import { createConnections, InternalConnection } from "./connection";
import { ApiConnection } from "./model";
import { Package } from "./package";

enum PackageStatus {
   LOADING = "loading",
   SERVING = "serving",
   UNLOADING = "unloading",
}

interface PackageInfo {
   name: string;
   loadTimestamp: number;
   status: PackageStatus;
}

type ApiPackage = components["schemas"]["Package"];
type ApiProject = components["schemas"]["Project"];

export class Project {
   private packages: Map<string, Package> = new Map();
   private packageMutexes = new Map<string, Mutex>();
   private packageStatuses: Map<string, PackageInfo> = new Map();
   private malloyConnections: Map<string, BaseConnection>;
   private apiConnections: ApiConnection[];
   private internalConnections: InternalConnection[];
   private projectPath: string;
   private projectName: string;
   public metadata: ApiProject;

   constructor(
      projectName: string,
      projectPath: string,
      malloyConnections: Map<string, BaseConnection>,
      internalConnections: InternalConnection[],
      apiConnections: InternalConnection[],
   ) {
      this.projectName = projectName;
      this.projectPath = projectPath;
      this.malloyConnections = malloyConnections;
      // InternalConnections have full connection details for doing schema inspection
      this.internalConnections = internalConnections;
      this.apiConnections = apiConnections;
      this.metadata = {
         resource: `${API_PREFIX}/projects/${this.projectName}`,
         name: this.projectName,
         location: this.projectPath,
      };
      void this.reloadProjectMetadata();
   }

   public async update(payload: ApiProject) {
      if (payload.name) {
         this.projectName = payload.name;
         this.packages.forEach((_package) => {
            _package.setProjectName(this.projectName);
         });
         this.metadata.name = this.projectName;
      }
      if (payload.resource) {
         this.projectPath = payload.resource.replace(
            `${API_PREFIX}/projects/`,
            "",
         );
         if (
            !(await fs.promises
               .access(this.projectPath)
               .then(() => true)
               .catch(() => false))
         ) {
            throw new ProjectNotFoundError(
               `Project path "${this.projectPath}" not found`,
            );
         }
         this.metadata.resource = payload.resource;
      }
      this.metadata.readme = payload.readme;
      // const connections = payload.connections;

      // Handle connections update
      if (payload.connections) {
         logger.info(
            `Updating ${payload.connections.length} connections for project ${this.projectName}`,
         );

         // Reload connections with full config
         const { malloyConnections, apiConnections } = await createConnections(
            this.projectPath,
            payload.connections,
         );

         // Update the project's connection maps
         this.malloyConnections = malloyConnections;
         this.apiConnections = apiConnections;
         this.internalConnections = apiConnections;

         logger.info(
            `Successfully updated connections for project ${this.projectName}`,
            {
               malloyConnections: malloyConnections.size,
               apiConnections: apiConnections.length,
               internalConnections: apiConnections.length,
            },
         );
      }

      return this;
   }

   static async create(
      projectName: string,
      projectPath: string,
      defaultConnections: ApiConnection[],
   ): Promise<Project> {
      if (!(await fs.promises.stat(projectPath)).isDirectory()) {
         throw new ProjectNotFoundError(
            `Project path ${projectPath} not found`,
         );
      }

      let malloyConnections: Map<string, BaseConnection> = new Map();
      let apiConnections: InternalConnection[] = [];

      logger.info(`Creating project with connection configuration`);
      const result = await createConnections(
         projectPath,
         defaultConnections,
      );
      malloyConnections = result.malloyConnections;
      apiConnections = result.apiConnections;

      logger.info(
         `Loaded ${malloyConnections.size + apiConnections.length} connections for project ${projectName}`,
         {
            malloyConnections,
            apiConnections,
         },
      );

      return new Project(
         projectName,
         projectPath,
         malloyConnections,
         apiConnections,
         apiConnections.map((internalConnection) => {
            // Create a new ApiConnection object from each InternalConnection
            // by excluding the internal connection details
            // We don't want to send passwords and connection strings to the client
            return {
               name: internalConnection.name,
               type: internalConnection.type,
               attributes: internalConnection.attributes,
               resource: internalConnection.resource,
            };
         }),
      );
   }

   public async reloadProjectMetadata(): Promise<ApiProject> {
      let readme = "";
      try {
         readme = (
            await fs.promises.readFile(path.join(this.projectPath, README_NAME))
         ).toString();
      } catch {
         // Readme not found, so we'll just return an empty string
      }
      this.metadata = {
         resource: `${API_PREFIX}/projects/${this.projectName}`,
         name: this.projectName,
         readme: readme,
      };
      return this.metadata;
   }

   public listApiConnections(): ApiConnection[] {
      return this.apiConnections;
   }

   public getApiConnection(connectionName: string): ApiConnection {
      const connection = this.apiConnections.find(
         (connection) => connection.name === connectionName,
      );
      if (!connection) {
         throw new ConnectionNotFoundError(
            `Connection ${connectionName} not found`,
         );
      }
      return connection;
   }

   // Returns a connection with full connection details for doing schema inspection
   // Don't send this to the client as it contains sensitive information
   public getInternalConnection(connectionName: string): InternalConnection {
      const connection = this.internalConnections.find(
         (connection) => connection.name === connectionName,
      );
      if (!connection) {
         throw new ConnectionNotFoundError(
            `Connection ${connectionName} not found`,
         );
      }
      return connection;
   }

   public getMalloyConnection(connectionName: string): BaseConnection {
      const connection = this.malloyConnections.get(connectionName);
      if (!connection) {
         throw new ConnectionNotFoundError(
            `Connection ${connectionName} not found`,
         );
      }
      return connection;
   }

   public async listPackages(): Promise<ApiPackage[]> {
      logger.info("Listing packages", { projectPath: this.projectPath });
      try {
         const files = await fs.promises.readdir(this.projectPath, {
            withFileTypes: true,
         });
         const packageDirectories = files.filter(
            (file) =>
               file.isDirectory() &&
               fs.existsSync(
                  path.join(this.projectPath, file.name, PACKAGE_MANIFEST_NAME),
               ),
         );
         const packageMetadata = await Promise.all(
            packageDirectories.map(async (directory) => {
               try {
                  return (
                     await this.getPackage(directory.name, false)
                  ).getPackageMetadata();
               } catch (error) {
                  logger.error(
                     `Failed to load package: ${directory.name} due to : ${error}`,
                  );
                  // Directory did not contain a valid package.json file -- therefore, it's not a package.
                  // Or it timed out
                  return undefined;
               }
            }),
         );
         // Get rid of undefined entries (i.e, directories without publisher.json files).
         const filteredMetadata = packageMetadata.filter(
            (metadata) => metadata,
         ) as ApiPackage[];

         // Filter out packages that are being unloaded
         const finalMetadata = filteredMetadata.filter((metadata) => {
            const packageStatus = this.packageStatuses.get(metadata.name || "");
            return packageStatus?.status !== PackageStatus.UNLOADING;
         });

         return finalMetadata;
      } catch (error) {
         logger.error("Error listing packages", { error });
         console.error(error);
         throw error;
      }
   }

   public async getPackage(
      packageName: string,
      reload: boolean = false,
   ): Promise<Package> {
      // Check if package is already loaded first
      const _package = this.packages.get(packageName);
      if (_package !== undefined && !reload) {
         return _package;
      }

      // We need to acquire the mutex to prevent a thundering herd of requests from creating the
      // package multiple times.
      let packageMutex = this.packageMutexes.get(packageName);
      if (packageMutex?.isLocked()) {
         await packageMutex.waitForUnlock();
         const existingPackage = this.packages.get(packageName);
         if (existingPackage) {
            return existingPackage;
         }
      }
      packageMutex = new Mutex();
      this.packageMutexes.set(packageName, packageMutex);

      return packageMutex.runExclusive(async () => {
         // Double-check after acquiring mutex
         const existingPackage = this.packages.get(packageName);
         if (existingPackage !== undefined && !reload) {
            return existingPackage;
         }

         // Set package status to loading
         this.packageStatuses.set(packageName, {
            name: packageName,
            loadTimestamp: 0,
            status: PackageStatus.LOADING,
         });

         try {
            const _package = await Package.create(
               this.projectName,
               packageName,
               path.join(this.projectPath, packageName),
               this.malloyConnections,
            );
            this.packages.set(packageName, _package);

            // Set package status to serving
            this.packageStatuses.set(packageName, {
               name: packageName,
               loadTimestamp: Date.now(),
               status: PackageStatus.SERVING,
            });

            return _package;
         } catch (error) {
            // Clean up on error - mutex will be automatically released by runExclusive
            this.packages.delete(packageName);
            this.packageStatuses.delete(packageName);
            throw error;
         }
         // Mutex is automatically released here by runExclusive
      });
   }

   public async addPackage(packageName: string) {
      const packagePath = path.join(this.projectPath, packageName);
      if (
         !(await fs.promises
            .access(packagePath)
            .then(() => true)
            .catch(() => false)) ||
         !(await fs.promises.stat(packagePath)).isDirectory()
      ) {
         throw new PackageNotFoundError(`Package ${packageName} not found`);
      }
      logger.info(
         `Adding package ${packageName} to project ${this.projectName}`,
         {
            packagePath,
            malloyConnections: this.malloyConnections,
         },
      );
      this.packages.set(
         packageName,
         await Package.create(
            this.projectName,
            packageName,
            packagePath,
            this.malloyConnections,
         ),
      );
      return this.packages.get(packageName);
   }

   public async updatePackage(packageName: string, body: ApiPackage) {
      const _package = this.packages.get(packageName);
      if (!_package) {
         throw new PackageNotFoundError(`Package ${packageName} not found`);
      }
      if (body.name) {
         _package.setName(body.name);
      }
      _package.setPackageMetadata({
         name: body.name,
         description: body.description,
         resource: body.resource,
         location: body.location,
      });
      return _package.getPackageMetadata();
   }

   public getPackageStatus(packageName: string): PackageInfo | undefined {
      return this.packageStatuses.get(packageName);
   }

   public setPackageStatus(packageName: string, status: PackageStatus): void {
      const currentStatus = this.packageStatuses.get(packageName);
      this.packageStatuses.set(packageName, {
         name: packageName,
         loadTimestamp: currentStatus?.loadTimestamp || Date.now(),
         status: status,
      });
   }

   public async deletePackage(packageName: string): Promise<void> {
      const _package = this.packages.get(packageName);
      if (!_package) {
         return;
      }
      const packageStatus = this.packageStatuses.get(packageName);

      if (packageStatus?.status === PackageStatus.LOADING) {
         logger.error("Package loading. Can't unload.", {
            projectName: this.projectName,
            packageName,
         });
         throw new Error(
            "Package loading. Can't unload. " +
               this.projectName +
               " " +
               packageName,
         );
      } else if (packageStatus?.status === PackageStatus.SERVING) {
         this.setPackageStatus(packageName, PackageStatus.UNLOADING);
      }

      try {
         await fs.promises.rm(path.join(this.projectPath, packageName), {
            recursive: true,
            force: true,
         });
      } catch (err) {
         logger.error(
            "Error removing package directory while unloading package",
            { error: err, projectName: this.projectName, packageName },
         );
      }

      // Remove from internal tracking
      this.packages.delete(packageName);
      this.packageStatuses.delete(packageName);
   }

   public async serialize(): Promise<ApiProject> {
      return {
         ...this.metadata,
         connections: this.listApiConnections(),
         packages: await this.listPackages(),
      };
   }
}
