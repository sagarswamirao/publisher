import { components } from "../api";
import { ModelNotFoundError } from "../errors";
import { Project } from "../service/project";

type ApiModel = components["schemas"]["Model"];
type ApiCompiledModel = components["schemas"]["CompiledModel"];

export class ModelController {
   private project: Project;

   constructor(project: Project) {
      this.project = project;
   }

   public async listModels(packageName: string): Promise<ApiModel[]> {
      const p = await this.project.getPackage(packageName);
      return p.listModels();
   }

   public async getModel(
      packageName: string,
      modelPath: string,
   ): Promise<ApiCompiledModel> {
      const model = (
         await this.project.getPackage(packageName)
      ).getModel(modelPath);
      if (!model) {
         throw new ModelNotFoundError(`${modelPath} does not exist`);
      }
      return model.getModel();
   }
}
