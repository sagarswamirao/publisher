import { getWorkingDirectory } from "../utils";
import * as fs from "fs/promises";
import { components } from "../api";
import { Package } from "./package";

type ApiPackage = components["schemas"]["Package"];

export class PackageService {
   private packages: Map<string, Package> = new Map();

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
         _package = await Package.create(packageName);
         this.packages.set(packageName, _package);
      }
      return _package;
   }
}
