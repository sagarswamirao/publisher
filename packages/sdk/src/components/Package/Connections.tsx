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
import { Connection as ApiConnection } from "../../client/api";
import { StyledCard, StyledCardContent } from "../styles";

const connectionsApi = new ConnectionsApi(new Configuration());
const queryClient = new QueryClient();

interface ConnectionsProps {
   server?: string;
   projectName: string;
   accessToken: string;
   navigate: (to: string, event?: React.MouseEvent) => void;
}

// TODO(jjs) - Move this UI to the ConnectionExplorer component
function Connection({ connection }: { connection: ApiConnection }) {
   return (
      <TableRow key={connection.name}>
         <TableCell>
            <Typography variant="body2">{connection.name}</Typography>
         </TableCell>
         <TableCell>
            <Typography variant="body2">{connection.type}</Typography>
         </TableCell>
      </TableRow>
   );
}

export default function Connections(connectionProps: ConnectionsProps) {
   const { server, projectName, accessToken } = connectionProps;
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
               Database Connections
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
                           <Connection key={conn.name} connection={conn} />
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
