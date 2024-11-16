import { components } from "../api";
import { PackageService } from "../service/package.service";

type ApiPackage = components["schemas"]["Package"];

export class PackageController {
   private packageService: PackageService;

   constructor(packageService: PackageService) {
      this.packageService = packageService;
   }

   public async listPackages(): Promise<ApiPackage[]> {
      return await this.packageService.listPackages();
   }

   public async getPackage(packageName: string): Promise<ApiPackage> {
      const p = await this.packageService.getPackage(packageName);
      return p.getPackageMetadata();
   }
}
