import { components } from "../api";
import { ModelNotFoundError } from "../errors";
import { ProjectStore } from "../service/project_store";

type ApiModel = components["schemas"]["Model"];
type ApiCompiledModel = components["schemas"]["CompiledModel"];

export class ModelController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async listModels(projectName: string, packageName: string): Promise<ApiModel[]> {
      const project = await this.projectStore.getProject(projectName);
      const p = await project.getPackage(packageName);
      return p.listModels();
   }

   public async getModel(
      projectName: string,
      packageName: string,
      modelPath: string,
   ): Promise<ApiCompiledModel> {
      const project = await this.projectStore.getProject(projectName);
      const p = await project.getPackage(packageName);
      const model = p.getModel(modelPath);
      if (!model) {
         throw new ModelNotFoundError(`${modelPath} does not exist`);
      }
      return model.getModel();
   }
}
