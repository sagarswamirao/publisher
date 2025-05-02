import { modelDefToModelInfo, queryResultToMalloyResult } from "@malloydata/malloy";
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
      sourceName: string,
      queryName: string,
      query: string,
   ): Promise<ApiQuery> {
      const project = await this.projectStore.getProject(projectName, false);
      const p = await project.getPackage(packageName, false);
      const model = p.getModel(modelPath);

      if (!model) {
         throw new ModelNotFoundError(`${modelPath} does not exist`);
      } else {
         const { result, modelInfo, dataStyles } =
            await model.getQueryResults(sourceName, queryName, query);
         // const result = queryResultToMalloyResult(
         //    modelInfo,
         //    queryResults?._queryResult,
         // );
         return {
            dataStyles: JSON.stringify(dataStyles),
            // modelDef: JSON.stringify(modelDef),
            modelInfo: JSON.stringify(modelInfo),
            // queryResult: JSON.stringify(queryResults?._queryResult),
            result: JSON.stringify(result),
         } as ApiQuery;
      }
   }
}
