import { components } from "../api";
import { Project } from "../service/project";

type ApiDatabase = components["schemas"]["Database"];

export class DatabaseController {
   private project: Project;

   constructor(project: Project) {
      this.project = project;
   }

   public async listDatabases(packageName: string): Promise<ApiDatabase[]> {
      const p = await this.project.getPackage(packageName);
      return p.listDatabases();
   }
}
