import { components } from "../api";
import { PackageService } from "../service/package.service";

type ApiDatabase = components["schemas"]["Database"];

export class DatabaseController {
   private packageService: PackageService;

   constructor(packageService: PackageService) {
      this.packageService = packageService;
   }

   public async listDatabases(packageName: string): Promise<ApiDatabase[]> {
      const p = await this.packageService.getPackage(packageName);
      return p.listDatabases();
   }
}
