import { Box, Divider, Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Configuration, NotebooksApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";

const notebooksApi = new NotebooksApi(new Configuration());
const queryClient = new QueryClient();

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/"];

interface ModelsProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   navigate: (to: string, event?: React.MouseEvent) => void;
   accessToken?: string;
}

export default function Notebooks({
   server,
   projectName,
   packageName,
   versionId,
   navigate,
   accessToken,
}: ModelsProps) {
   const { data, isLoading, isError, error, isSuccess } = useQuery(
      {
         queryKey: ["notebooks", server, projectName, packageName, versionId],
         queryFn: () =>
            notebooksApi.listNotebooks(projectName, packageName, versionId, {
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
               Notebooks
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
                     Fetching Notebooks...
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
                        No notebooks found
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
