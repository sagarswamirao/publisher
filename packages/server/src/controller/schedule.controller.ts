import { components } from "../api";
import { PackageService } from "../service/package.service";

type ApiSchedule = components["schemas"]["Schedule"];

export class ScheduleController {
   private packageService: PackageService;

   constructor(packageService: PackageService) {
      this.packageService = packageService;
   }

   public async listSchedules(packageName: string): Promise<ApiSchedule[]> {
      const p = await this.packageService.getPackage(packageName);
      return p.listSchedules();
   }
}
