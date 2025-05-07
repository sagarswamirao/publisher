import {
   Box,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tooltip,
   Typography,
} from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Configuration, DatabasesApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";

const databasesApi = new DatabasesApi(new Configuration());
const queryClient = new QueryClient();

interface DatabaseProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   accessToken: string;
}

export default function Database({
   server,
   projectName,
   packageName,
   versionId,
   accessToken,
}: DatabaseProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["databases", server, projectName, packageName, versionId],
         queryFn: () =>
            databasesApi.listDatabases(projectName, packageName, versionId, {
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
   const formatFileSize = (size: number) => {
      if (size >= 1024 * 1024 * 1024 * 1024) {
         return `${(size / (1024 * 1024 * 1024)).toFixed(2)} TB`;
      } else if (size >= 1024 * 1024 * 1024) {
         return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      } else if (size >= 1024 * 1024) {
         return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      } else {
         return `${(size / 1024).toFixed(2)} KB`;
      }
   };
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
                  maxHeight: "200px",
                  overflowY: "auto",
               }}
            >
               {!isSuccess && !isError && (
                  <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
                     Fetching Databases...
                  </Typography>
               )}
               {isSuccess && data.data.length > 0 && (
                  <TableContainer>
                     <Table
                        size="small"
                        sx={{ "& .MuiTableCell-root": { padding: "10px" } }}
                     >
                        <TableHead>
                           <TableRow>
                              <TableCell>Database Name</TableCell>
                              <TableCell align="right">Size</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {data.data.map((database) => (
                              <TableRow key={database.path}>
                                 <TableCell>
                                    <Tooltip
                                       title={database.path}
                                       placement="top"
                                    >
                                       <Typography
                                          variant="body2"
                                          sx={{
                                             maxWidth: "200px",
                                             overflow: "hidden",
                                             textOverflow: "ellipsis",
                                             whiteSpace: "nowrap",
                                          }}
                                       >
                                          {database.path}
                                       </Typography>
                                    </Tooltip>
                                 </TableCell>
                                 <TableCell align="right">
                                    <Typography variant="body2">
                                       {formatFileSize(database.size)}
                                    </Typography>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </TableContainer>
               )}
               {isSuccess && data.data.length === 0 && (
                  <Typography variant="body2">No Embedded Databases</Typography>
               )}
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
