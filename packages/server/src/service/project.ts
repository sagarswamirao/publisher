import * as fs from "fs/promises";
import { components } from "../api";
import { Package } from "./package";
import { ApiConnection } from "./model";
type ApiPackage = components["schemas"]["Package"];
import { createConnections } from "./connection";
import { ConnectionNotFoundError } from "../errors";
import { BaseConnection } from "@malloydata/malloy/connection";
import * as path from "path";
import { ProjectNotFoundError } from "../errors";
type ApiAbout = components["schemas"]["About"];

export class Project {
   private packages: Map<string, Package> = new Map();
   private malloyConnections: Map<string, BaseConnection>;
   private apiConnections: ApiConnection[];
   private projectPath: string;
   constructor(
      projectPath: string,
      malloyConnections: Map<string, BaseConnection>,
      apiConnections: ApiConnection[],
   ) {
      this.projectPath = projectPath;
      this.malloyConnections = malloyConnections;
      this.apiConnections = apiConnections;
   }

   static async create(projectPath: string): Promise<Project> {
      if (!(await fs.stat(projectPath)).isDirectory()) {
         throw new ProjectNotFoundError(`Project path ${projectPath} not found`);
      }
      const { malloyConnections, apiConnections } = await createConnections(projectPath);
      return new Project(projectPath, malloyConnections, apiConnections);
   }

   public async getAbout(): Promise<ApiAbout> {
      try {
         const readme = (
            await fs.readFile(path.join(this.projectPath, "README.md"))
         ).toString();
         return { readme: readme };
      } catch (error) {
         console.log(error);
         return { readme: "" };
      }
   }

   public listApiConnections(): ApiConnection[] {
      return this.apiConnections;
   }

   public getApiConnection(connectionName: string): ApiConnection {
      const connection = this.apiConnections.find((connection) => connection.name === connectionName);
      if (!connection) {
         throw new ConnectionNotFoundError(`Connection ${connectionName} not found`);
      }
      return connection;
   }

   public getMalloyConnection(connectionName: string): BaseConnection {
      const connection = this.malloyConnections.get(connectionName);
      if (!connection) {
         throw new ConnectionNotFoundError(`Connection ${connectionName} not found`);
      }
      return connection;
   }

   public async listPackages(): Promise<ApiPackage[]> {
      const files = await fs.readdir(this.projectPath, { withFileTypes: true });
      const packageMetadata = await Promise.all(
         files
            .filter((file) => file.isDirectory())
            .map(async (directory) => {
               try {
                  const _package = await this.getPackage(directory.name);
                  return _package.getPackageMetadata();
               } catch {
                  return undefined;
               }
            }),
      );
      // Get rid of undefined entries (i.e, directories without malloy-package.json files).
      return packageMetadata.filter((metadata) => metadata) as ApiPackage[];
   }

   public async getPackage(packageName: string): Promise<Package> {
      let _package = this.packages.get(packageName);
      if (_package === undefined) {
         _package = await Package.create(
            packageName,
            path.join(this.projectPath, packageName),
            this.malloyConnections,
         );
         this.packages.set(packageName, _package);
      }
      return _package;
   }
}
