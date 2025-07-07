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
   // Optional props to override the value from usePackage hook
   optionalProjectName?: string;
   optionalPackageName?: string;
   optionalVersionId?: string;
}

export function createEmbeddedQueryResult(props: QueryResultProps): string {
   const { optionalProjectName, optionalPackageName } = props;
   if (!optionalProjectName || !optionalPackageName) {
      throw new Error(
         "Project and Package name must be provided for query embedding.",
      );
   }
   return JSON.stringify({
      ...props,
   });
}

/**
 * This is a helper function to render a query result that is embedded as a string.
 */
export function EmbeddedQueryResult({
   embeddedQueryResult,
}: {
   embeddedQueryResult: string;
}): React.ReactElement {
   const {
      modelPath,
      query,
      sourceName,
      queryName,
      optionalProjectName,
      optionalPackageName,
      optionalVersionId,
   } = JSON.parse(embeddedQueryResult) as QueryResultProps;

   if (
      !modelPath ||
      (!query && (!queryName || !sourceName)) ||
      typeof modelPath !== "string"
   ) {
      throw new Error("Invalid embedded query result: " + embeddedQueryResult);
   }
   return (
      <QueryResult
         modelPath={modelPath}
         query={query}
         sourceName={sourceName}
         queryName={queryName}
         optionalProjectName={optionalProjectName}
         optionalPackageName={optionalPackageName}
         optionalVersionId={optionalVersionId}
      />
   );
}

export default function QueryResult({
   modelPath,
   query,
   sourceName,
   queryName,
   optionalProjectName,
   optionalPackageName,
   optionalVersionId,
}: QueryResultProps) {
   // Always call usePackage - it should handle missing provider gracefully
   const packageContext = usePackage(false);

   // Use optional props if provided, otherwise fallback to hook values (with defaults)
   const projectName = optionalProjectName || packageContext?.projectName;
   const packageName = optionalPackageName || packageContext?.packageName;
   const versionId = optionalVersionId || packageContext?.versionId;

   if (!projectName || !packageName) {
      throw new Error(
         "No project or package name provided. Must be set in props or via PackageProvider",
      );
   }

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: [
         "queryResult",
         projectName,
         packageName,
         modelPath,
         versionId,
         query,
         sourceName,
         queryName,
      ],
      queryFn: (config) =>
         queryResultsApi.executeQuery(
            projectName,
            packageName,
            modelPath,
            query,
            sourceName,
            queryName,
            versionId,
            config,
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
