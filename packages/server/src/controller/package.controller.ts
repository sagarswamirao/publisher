import { components } from "../api";
import { BadRequestError } from "../errors";
import { ProjectStore } from "../service/project_store";

type ApiPackage = components["schemas"]["Package"];

export class PackageController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async listPackages(projectName: string): Promise<ApiPackage[]> {
      const project = await this.projectStore.getProject(projectName, false);
      return project.listPackages();
   }

   public async getPackage(
      projectName: string,
      packageName: string,
      reload: boolean,
   ): Promise<ApiPackage> {
      const project = await this.projectStore.getProject(projectName, false);
      const p = await project.getPackage(packageName, reload);
      return p.getPackageMetadata();
   }

   async addPackage(projectName: string, body: ApiPackage) {
      if (!body.name) {
         throw new BadRequestError("Package name is required");
      }
      const project = await this.projectStore.getProject(projectName, false);
      return project.addPackage(body.name);
   }

   public async deletePackage(projectName: string, packageName: string) {
      const project = await this.projectStore.getProject(projectName, false);
      return project.deletePackage(packageName);
   }

   public async updatePackage(
      projectName: string,
      packageName: string,
      body: ApiPackage,
   ) {
      const project = await this.projectStore.getProject(projectName, false);
      return project.updatePackage(packageName, body);
   }
}
