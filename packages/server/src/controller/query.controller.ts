import { components } from "../api";
import { ModelNotFoundError } from "../errors";
import { ProjectStore } from "../service/project_store";

type ApiQuery = components["schemas"]["Query"];

export class QueryController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async getQuery(
      projectName: string,
      packageName: string,
      modelPath: string,
      sourceName?: string,
      queryName?: string,
      query?: string,
   ): Promise<ApiQuery> {
      const project = await this.projectStore.getProject(projectName);
      const p = await project.getPackage(packageName);
      const model = p.getModel(modelPath);
      if (!model) {
         throw new ModelNotFoundError(`${modelPath} does not exist`);
      }
      const { queryResults, modelDef, dataStyles } =
         await model.getQueryResults(sourceName, queryName, query);
      return {
         dataStyles: JSON.stringify(dataStyles),
         modelDef: JSON.stringify(modelDef),
         queryResult: JSON.stringify(queryResults?._queryResult),
      } as ApiQuery;
   }
}
