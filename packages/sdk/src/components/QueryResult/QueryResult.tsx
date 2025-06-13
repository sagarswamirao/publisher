import { Suspense, lazy } from "react";
import { Configuration, QueryresultsApi } from "../../client";
import axios from "axios";
import { Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { usePublisherPackage } from "../Package/PublisherPackageProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

const RenderedResult = lazy(() => import("../RenderedResult/RenderedResult"));

axios.defaults.baseURL = "http://localhost:4000";
const queryResultsApi = new QueryresultsApi(new Configuration());
const queryClient = new QueryClient();

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
      usePublisherPackage();

   const { data, isSuccess, isError, error } = useQuery(
      {
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
         retry: false,
      },
      queryClient,
   );

   return (
      <>
         {!isSuccess && !isError && (
            <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
               Fetching Query Results...
            </Typography>
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
