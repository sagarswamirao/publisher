import {
   Box,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableRow,
   Typography,
} from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Configuration, ConnectionsApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";

const connectionsApi = new ConnectionsApi(new Configuration());
const queryClient = new QueryClient();

interface ConnectionsProps {
   server?: string;
   projectName: string;
   accessToken: string;
}

export default function Connections({
   server,
   projectName,
   accessToken,
}: ConnectionsProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["connections", server, projectName],
         queryFn: () =>
            connectionsApi.listConnections(projectName, {
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
               Connections
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
                     Fetching Connections...
                  </Typography>
               )}
               {isSuccess && data.data.length > 0 && (
                  <Table size="small">
                     <TableBody>
                        <TableRow>
                           <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                 Connection Name
                              </Typography>
                           </TableCell>
                           <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                 Type
                              </Typography>
                           </TableCell>
                        </TableRow>
                        {data.data.map((conn) => (
                           <TableRow key={conn.name}>
                              <TableCell>
                                 <Typography variant="body2">
                                    {conn.name}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">
                                    {conn.type}
                                 </Typography>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
               {isSuccess && data.data.length === 0 && (
                  <Typography variant="body2">No Connections</Typography>
               )}
               {isError && (
                  <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                     {`${projectName} - ${error.message}`}
                  </Typography>
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
