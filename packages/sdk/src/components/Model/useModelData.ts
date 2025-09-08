import { CompiledModel } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { parseResourceUri } from "../../utils/formatting";
import { useApiClients } from "../ServerProvider";

/**
 * Custom hook for fetching model data. Combines usePackage context with
 * useQueryWithApiError to fetch a compiled model.
 */
export function useModelData(resourceUri: string) {
   const { modelPath, projectName, packageName, versionId } =
      parseResourceUri(resourceUri);
   const { models } = useApiClients();

   return useQueryWithApiError<CompiledModel>({
      queryKey: ["package", projectName, packageName, modelPath, versionId],
      queryFn: async () => {
         const response = await models.getModel(
            projectName,
            packageName,
            modelPath,
            versionId,
         );
         return response.data;
      },
   });
}
