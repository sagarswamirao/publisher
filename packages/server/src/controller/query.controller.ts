import { components } from "../api";
import { Project } from "../service/project";
import { ModelNotFoundError } from "../errors";

type ApiQuery = components["schemas"]["Query"];

export class QueryController {
   private project: Project;

   constructor(project: Project) {
      this.project = project;
   }

   public async getQuery(
      packageName: string,
      modelPath: string,
      sourceName?: string,
      queryName?: string,
      query?: string,
   ): Promise<ApiQuery> {
      const model = (
         await this.project.getPackage(packageName)
      ).getModel(modelPath);
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
