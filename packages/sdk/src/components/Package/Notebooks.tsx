import { Box, Divider, Typography } from "@mui/material";
import { Configuration, NotebooksApi } from "../../client";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";
import { usePackage } from "./PackageProvider";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const notebooksApi = new NotebooksApi(new Configuration());

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/"];

interface NotebooksProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Notebooks({ navigate }: NotebooksProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePackage();

   const { data, isError, error, isSuccess } = useQueryWithApiError({
      queryKey: ["notebooks", server, projectName, packageName, versionId],
      queryFn: async () => {
         const response = await notebooksApi.listNotebooks(
            projectName,
            packageName,
            versionId,
            {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            },
         );
         return response;
      },
   });

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
                  <Loading text="Fetching Notebooks..." />
               )}
               {isError && (
                  <ApiErrorDisplay
                     error={error}
                     context={`${projectName} > ${packageName} > Notebooks`}
                  />
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
               {isSuccess && data.data.length === 0 && (
                  <Typography variant="body2">No notebooks found</Typography>
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
