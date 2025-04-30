import { components } from "../api";
import { ProjectStore } from "../service/project_store";

type ApiDatabase = components["schemas"]["Database"];

export class DatabaseController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async listDatabases(
      projectName: string,
      packageName: string,
   ): Promise<ApiDatabase[]> {
      const project = await this.projectStore.getProject(projectName);
      const p = await project.getPackage(packageName);
      return p.listDatabases();
   }
}
