import { components } from "../api";
import { ModelNotFoundError } from "../errors";
import { PackageService } from "../service/package.service";

type ApiModel = components["schemas"]["Model"];
type ApiCompiledModel = components["schemas"]["CompiledModel"];

export class ModelController {
   private packageService: PackageService;

   constructor(packageService: PackageService) {
      this.packageService = packageService;
   }

   public async listModels(packageName: string): Promise<ApiModel[]> {
      const p = await this.packageService.getPackage(packageName);
      return p.listModels();
   }

   public async getModel(
      packageName: string,
      modelPath: string,
   ): Promise<ApiCompiledModel> {
      const model = (
         await this.packageService.getPackage(packageName)
      ).getModel(modelPath);
      if (!model) {
         throw new ModelNotFoundError(`${modelPath} does not exist`);
      }
      return model.getModel();
   }
}
