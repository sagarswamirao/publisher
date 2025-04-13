import { components } from "../api";
import { Project } from "../service/project";

type ApiPackage = components["schemas"]["Package"];

export class PackageController {
   private project: Project;

   constructor(project: Project) {
      this.project = project;
   }

   public async listPackages(): Promise<ApiPackage[]> {
      return await this.project.listPackages();
   }

   public async getPackage(packageName: string): Promise<ApiPackage> {
      const p = await this.project.getPackage(packageName);
      return p.getPackageMetadata();
   }
}
