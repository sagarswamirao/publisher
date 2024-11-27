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
   packageName: string;
   versionId?: string;
   navigate: (to: string) => void;
   accessToken?: string;
}

export default function Models({
   server,
   packageName,
   versionId,
   navigate,
   accessToken,
}: ModelsProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["models", server, packageName, versionId],
         queryFn: () =>
            modelsApi.listModels(packageName, versionId, {
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
               Models
            </Typography>
            <Divider />
            <Box
               sx={{
                  mt: "10px",
                  maxHeight: "300px",
                  overflowY: "auto",
               }}
            >
               {!isSuccess && !isError && (
                  <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
                     Fetching Models
                  </Typography>
               )}
               {isSuccess && data.data.length > 0 && (
                  <FileTreeView
                     items={data.data.sort((a, b) => {
                        return a.path.localeCompare(b.path);
                     })}
                     defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                     navigate={navigate}
                  />
               )}
               {isError && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     {`${packageName} > ${versionId} - ${error.message}`}
                  </Typography>
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
