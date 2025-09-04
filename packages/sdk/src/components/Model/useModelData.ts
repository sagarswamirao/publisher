import { Configuration, ModelsApi, CompiledModel } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const modelsApi = new ModelsApi(new Configuration());

/**
 * Custom hook for fetching model data. Combines usePackage context with
 * useQueryWithApiError to fetch a compiled model.
 */
export function useModelData(
   modelPath: string,
   projectName: string,
   packageName: string,
   versionId?: string,
) {
   return useQueryWithApiError<CompiledModel>({
      queryKey: ["package", projectName, packageName, modelPath, versionId],
      queryFn: async (config) => {
         const response = await modelsApi.getModel(
            projectName,
            packageName,
            modelPath,
            versionId,
            config,
         );
         return response.data;
      },
   });
}
