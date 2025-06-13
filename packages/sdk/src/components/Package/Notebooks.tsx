import { Box, Divider, Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Configuration, NotebooksApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";
import { usePublisherPackage } from "./PublisherPackageProvider";

const notebooksApi = new NotebooksApi(new Configuration());
const queryClient = new QueryClient();

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/"];

interface NotebooksProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Notebooks({ navigate }: NotebooksProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePublisherPackage();

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
         throwOnError: false,
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
               {!isSuccess && !isError && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     Fetching Notebooks...
                  </Typography>
               )}
               {isError && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     {error.message}
                  </Typography>
               )}
               {isSuccess && (
                  <FileTreeView
                     items={data.data.sort((a, b) => {
                        return a.path.localeCompare(b.path);
                     })}
                     defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                     navigate={navigate}
                  />
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
