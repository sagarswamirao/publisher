import { Suspense, lazy } from "react";
import { Configuration, QueryresultsApi } from "../../client";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { parseResourceUri } from "../../utils/formatting";

const RenderedResult = lazy(() => import("../RenderedResult/RenderedResult"));

const queryResultsApi = new QueryresultsApi(new Configuration());

interface QueryResultProps {
   modelPath: string;
   query?: string;
   sourceName?: string;
   queryName?: string;
   resourceUri?: string;
}

export function createEmbeddedQueryResult(props: QueryResultProps): string {
   const { project: optionalProjectName, package: optionalPackageName } =
      parseResourceUri(props.resourceUri);
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
   const { modelPath, query, sourceName, queryName, resourceUri } = JSON.parse(
      embeddedQueryResult,
   ) as QueryResultProps;

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
         resourceUri={resourceUri}
      />
   );
}

export default function QueryResult({
   modelPath,
   query,
   sourceName,
   queryName,
   resourceUri,
}: QueryResultProps) {
   const packageContext = parseResourceUri(resourceUri);
   const projectName = packageContext?.project;
   const packageName = packageContext?.package;
   const versionId = packageContext?.version;

   if (!projectName || !packageName) {
      throw new Error(
         "No project or package name provided. A resource URI must be provided.",
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
