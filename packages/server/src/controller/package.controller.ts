import { components } from "../api";
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
}
