import { parseResourceUri } from "../utils/formatting";
import { useQueryWithApiError } from "./useQueryWithApiError";
import { useApiClients } from "../components/ServerProvider";

interface UseRawQueryDataProps {
   modelPath: string;
   query?: string;
   sourceName?: string;
   queryName?: string;
   enabled?: boolean;
   resourceUri: string;
}

export function useRawQueryData({
   modelPath,
   query,
   sourceName,
   queryName,
   enabled = true,
   resourceUri,
}: UseRawQueryDataProps) {
   const { projectName, packageName, versionId } =
      parseResourceUri(resourceUri);
   const { queryResults } = useApiClients();

   const { data, isSuccess, isError, error, isLoading } = useQueryWithApiError({
      queryKey: [
         "rawQueryData",
         projectName,
         packageName,
         modelPath,
         versionId,
         query,
         sourceName,
         queryName,
      ],
      queryFn: () =>
         queryResults.executeQuery(
            projectName,
            packageName,
            modelPath,
            query,
            sourceName,
            queryName,
            versionId,
         ),
      enabled,
   });

   // Parse the JSON result string to get the raw data
   const rawData =
      isSuccess && data?.data?.result
         ? (() => {
              try {
                 const parsed = JSON.parse(data.data.result);
                 // Return the data.array_value array which contains the actual rows
                 return parsed.data?.array_value || [];
              } catch (e) {
                 console.error("Failed to parse query result:", e);
                 return [];
              }
           })()
         : [];

   return {
      data: rawData,
      isSuccess,
      isError,
      error,
      isLoading,
   };
}
