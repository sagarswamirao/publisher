import { Box, Divider, Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Configuration, ModelsApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";

axios.defaults.baseURL = "http://localhost:4000";
const modelsApi = new ModelsApi(new Configuration());
const queryClient = new QueryClient();

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/", "models/"];

interface ModelsProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   navigate: (to: string) => void;
   accessToken?: string;
}

export default function Models({
   server,
   projectName,
   packageName,
   versionId,
   navigate,
   accessToken,
}: ModelsProps) {
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
               {isLoading && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     Fetching Models...
                  </Typography>
               )}
               {isSuccess &&
                  (data.data.length > 0 ? (
                     <FileTreeView
                        items={data.data.sort((a, b) => {
                           return a.path.localeCompare(b.path);
                        })}
                        defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                        navigate={navigate}
                     />
                  ) : (
                     <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                        No models found
                     </Typography>
                  ))}
               {isError && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     {`${projectName} > ${packageName} > ${versionId} - ${error.message}`}
                  </Typography>
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
