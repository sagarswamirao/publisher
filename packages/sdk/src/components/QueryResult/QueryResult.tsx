import { Suspense, lazy } from "react";
import { Configuration, QueryresultsApi } from "../../client";
import { usePackage } from "../Package/PackageProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const RenderedResult = lazy(() => import("../RenderedResult/RenderedResult"));

const queryResultsApi = new QueryresultsApi(new Configuration());

interface QueryResultProps {
   modelPath: string;
   query?: string;
   sourceName?: string;
   queryName?: string;
}

export default function QueryResult({
   modelPath,
   query,
   sourceName,
   queryName,
}: QueryResultProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePackage();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: [
         "queryResult",
         server,
         projectName,
         packageName,
         modelPath,
         versionId,
         query,
         sourceName,
         queryName,
      ],
      queryFn: () =>
         queryResultsApi.executeQuery(
            projectName,
            packageName,
            modelPath,
            query,
            sourceName,
            queryName,
            versionId,
            {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            },
         ),
   });

   return (
      <>
         {!isSuccess && !isError && (
            <Loading text="Fetching Query Results..." />
         )}
         {isSuccess && (
            <Suspense fallback={<div>Loading...</div>}>
               <RenderedResult result={data.data.result} />
            </Suspense>
         )}
         {isError && (
            <ApiErrorDisplay
               context={`${projectName} > ${packageName} > ${modelPath}`}
               error={error}
            />
         )}
      </>
   );
}
