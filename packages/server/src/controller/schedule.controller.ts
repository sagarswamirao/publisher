import { components } from "../api";
import { ProjectStore } from "../service/project_store";

type ApiSchedule = components["schemas"]["Schedule"];

export class ScheduleController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async listSchedules(
      projectName: string,
      packageName: string,
   ): Promise<ApiSchedule[]> {
      const project = await this.projectStore?.getProject?.(projectName);
      const p = await project?.getPackage?.(packageName);
      return p?.listSchedules?.();
   }
}
