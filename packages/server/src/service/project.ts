import { BaseConnection } from "@malloydata/malloy/connection";
import { Mutex } from "async-mutex";
import * as fs from "fs/promises";
import * as path from "path";
import { components } from "../api";
import { API_PREFIX, README_NAME } from "../constants";
import {
   ConnectionNotFoundError,
   PackageNotFoundError,
   ProjectNotFoundError,
} from "../errors";
import { createConnections, InternalConnection } from "./connection";
import { ApiConnection } from "./model";
import { Package } from "./package";
type ApiPackage = components["schemas"]["Package"];
type ApiProject = components["schemas"]["Project"];

export class Project {
   private packages: Map<string, Package> = new Map();
   private packageMutexes = new Map<string, Mutex>();
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
         if (!(await fs.exists(this.projectPath))) {
            throw new ProjectNotFoundError(
               `Project path "${this.projectPath}" not found`,
            );
         }
         this.metadata.resource = payload.resource;
      }
      this.metadata.readme = payload.readme;
      return this;
   }

   static async create(
      projectName: string,
      projectPath: string,
   ): Promise<Project> {
      if (!(await fs.stat(projectPath)).isDirectory()) {
         throw new ProjectNotFoundError(
            `Project path ${projectPath} not found`,
         );
      }
      const { malloyConnections, apiConnections } =
         await createConnections(projectPath);
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
            await fs.readFile(path.join(this.projectPath, README_NAME))
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
      try {
         const files = await fs.readdir(this.projectPath, {
            withFileTypes: true,
         });
         const packageMetadata = await Promise.all(
            files
               .filter((file) => file.isDirectory())
               .map(async (directory) => {
                  try {
                     return (
                        await this.getPackage(directory.name, false)
                     ).getPackageMetadata();
                  } catch (error) {
                     console.log(
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
         return filteredMetadata;
      } catch (error) {
         throw new Error("Error listing packages: " + error);
      }
   }

   public async getPackage(
      packageName: string,
      reload: boolean,
   ): Promise<Package> {
      // We need to acquire the mutex to prevent a thundering herd of requests from creating the
      // package multiple times.
      let packageMutex = this.packageMutexes.get(packageName);
      if (!packageMutex) {
         packageMutex = new Mutex();
         this.packageMutexes.set(packageName, packageMutex);
      }

      return await packageMutex.runExclusive(async () => {
         const _package = this.packages.get(packageName);
         if (_package !== undefined && !reload) {
            return _package;
         }

         try {
            const _package = await Package.create(
               this.projectName,
               packageName,
               path.join(this.projectPath, packageName),
               this.malloyConnections,
            );
            this.packages.set(packageName, _package);
            return _package;
         } catch (error) {
            this.packages.delete(packageName);
            throw error;
         }
      });
   }

   public async addPackage(packageName: string) {
      const packagePath = path.join(this.projectPath, packageName);
      if (
         !(await fs.exists(packagePath)) ||
         !(await fs.stat(packagePath)).isDirectory()
      ) {
         throw new PackageNotFoundError(`Package ${packageName} not found`);
      }
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

   public async deletePackage(packageName: string) {
      const _package = this.packages.get(packageName);
      if (!_package) {
         throw new PackageNotFoundError(`Package ${packageName} not found`);
      }
      await fs.rm(path.join(this.projectPath, packageName), {
         recursive: true,
      });
      this.packages.delete(packageName);
   }

   public async serialize(): Promise<ApiProject> {
      return {
         ...this.metadata,
         connections: this.listApiConnections(),
         packages: await this.listPackages(),
      };
   }
}
