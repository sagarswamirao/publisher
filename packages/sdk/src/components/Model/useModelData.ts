import { Configuration, ModelsApi, CompiledModel } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { parseResourceUri } from "../../utils/formatting";

const modelsApi = new ModelsApi(new Configuration());

/**
 * Custom hook for fetching model data. Combines usePackage context with
 * useQueryWithApiError to fetch a compiled model.
 */
export function useModelData(resourceUri: string) {
   const { modelPath, projectName, packageName, versionId } =
      parseResourceUri(resourceUri);
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
