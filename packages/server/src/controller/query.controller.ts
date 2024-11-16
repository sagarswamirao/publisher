import { components } from "../api";
import { PackageService } from "../service/package.service";
import { ModelNotFoundError } from "../errors";

type ApiQuery = components["schemas"]["Query"];

export class QueryController {
   private packageService: PackageService;

   constructor(packageService: PackageService) {
      this.packageService = packageService;
   }

   public async getQuery(
      packageName: string,
      modelPath: string,
      sourceName?: string,
      queryName?: string,
      query?: string,
   ): Promise<ApiQuery> {
      const model = (
         await this.packageService.getPackage(packageName)
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
