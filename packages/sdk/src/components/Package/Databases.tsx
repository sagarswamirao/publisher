import { Box, Divider, Typography } from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Configuration, DatabasesApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { FileTreeView } from "./FileTreeView";

axios.defaults.baseURL = "http://localhost:4000";
const databasesApi = new DatabasesApi(new Configuration());
const queryClient = new QueryClient();

const DEFAULT_EXPANDED_FOLDERS = ["data/"];

interface PackageProps {
   server?: string;
   packageName: string;
   versionId?: string;
   accessToken: string;
}

export default function Package({
   server,
   packageName,
   versionId,
   accessToken,
}: PackageProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["databases", server, packageName, versionId],
         queryFn: () =>
            databasesApi.listDatabases(packageName, versionId, {
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
               Embedded Databases
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
                     Fetching Databases...
                  </Typography>
               )}
               {isSuccess && data.data.length > 0 && (
                  <FileTreeView
                     items={data.data}
                     defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                  />
               )}
               {isSuccess && data.data.length === 0 && (
                  <Typography variant="body2">No Embedded Databases</Typography>
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
