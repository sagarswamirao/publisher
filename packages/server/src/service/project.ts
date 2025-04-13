import { getWorkingDirectory } from "../utils";
import * as fs from "fs/promises";
import { components } from "../api";
import { Package } from "./package";
import { ApiConnection } from "./model";
type ApiPackage = components["schemas"]["Package"];
import { createConnections } from "./connection";
import { ConnectionNotFoundError } from "../errors";
import { BaseConnection } from "@malloydata/malloy/connection";

export class Project {
   private packages: Map<string, Package> = new Map();
   private malloyConnections: Map<string, BaseConnection>;
   private apiConnections: ApiConnection[];

   constructor(malloyConnections: Map<string, BaseConnection>, apiConnections: ApiConnection[]) {
      this.malloyConnections = malloyConnections;
      this.apiConnections = apiConnections;
   }

   static async create(): Promise<Project> {
      const { malloyConnections, apiConnections } = await createConnections(getWorkingDirectory());
      return new Project(malloyConnections, apiConnections);
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
      const workingDirectory = getWorkingDirectory();
      const files = await fs.readdir(workingDirectory, { withFileTypes: true });
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
         _package = await Package.create(packageName, this.malloyConnections);
         this.packages.set(packageName, _package);
      }
      return _package;
   }
}
