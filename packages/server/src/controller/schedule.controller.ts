import { components } from "../api";
import { Project } from "../service/project";

type ApiSchedule = components["schemas"]["Schedule"];

export class ScheduleController {
   private project: Project;

   constructor(project: Project) {
      this.project = project;
   }

   public async listSchedules(packageName: string): Promise<ApiSchedule[]> {
      const p = await this.project.getPackage(packageName);
      return p.listSchedules();
   }
}
