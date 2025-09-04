import { Configuration, ModelsApi, CompiledModel } from "../../client";
import { usePublisherResource } from "../Package";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const modelsApi = new ModelsApi(new Configuration());

/**
 * Custom hook for fetching model data. Combines usePackage context with
 * useQueryWithApiError to fetch a compiled model.
 */
export function useModelData(modelPath: string, versionId?: string) {
   const {
      projectName,
      packageName,
      versionId: packageVersionId,
   } = usePublisherResource();
   const effectiveVersionId = versionId || packageVersionId;

   return useQueryWithApiError<CompiledModel>({
      queryKey: [
         "package",
         projectName,
         packageName,
         modelPath,
         effectiveVersionId,
      ],
      queryFn: async (config) => {
         const response = await modelsApi.getModel(
            projectName,
            packageName,
            modelPath,
            effectiveVersionId,
            config,
         );
         return response.data;
      },
   });
}
