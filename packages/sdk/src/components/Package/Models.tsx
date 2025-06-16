import { Box, Divider, Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Configuration, ModelsApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";
import { usePackage } from "./PackageProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";

axios.defaults.baseURL = "http://localhost:4000";
const modelsApi = new ModelsApi(new Configuration());
const queryClient = new QueryClient();

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/", "models/"];

interface ModelsProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Models({ navigate }: ModelsProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePackage();

   const { data, isError, error, isLoading, isSuccess } = useQuery(
      {
         queryKey: ["models", server, projectName, packageName, versionId],
         queryFn: () =>
            modelsApi.listModels(projectName, packageName, versionId, {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
         throwOnError: false,
         retry: false,
      },
      queryClient,
   );

   return (
      <StyledCard variant="outlined" sx={{ padding: "10px", width: "100%" }}>
         <StyledCardContent>
            <Typography variant="overline" fontWeight="bold">
               Semantic Models
            </Typography>
            <Divider />
            <Box
               sx={{
                  mt: "10px",
                  maxHeight: "200px",
                  overflowY: "auto",
               }}
            >
               {!isSuccess && !isError && <Loading text="Fetching Models..." />}
               {isError && (
                  <ApiErrorDisplay
                     error={error}
                     context={`${projectName} > ${packageName} > Models`}
                  />
               )}
               {isSuccess && data.data.length > 0 && (
                  <FileTreeView
                     items={data.data.sort((a, b) => {
                        return a.path.localeCompare(b.path);
                     })}
                     navigate={navigate}
                     defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                  />
               )}
               {isSuccess && data.data.length === 0 && (
                  <Typography>No models found.</Typography>
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
