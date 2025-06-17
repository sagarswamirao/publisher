import {
   Box,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableRow,
   Typography,
} from "@mui/material";
import { Configuration, ConnectionsApi } from "../../client";
import { Connection as ApiConnection } from "../../client/api";
import { StyledCard, StyledCardContent } from "../styles";
import { usePackage } from "./PackageProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const connectionsApi = new ConnectionsApi(new Configuration());

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

export default function Connections() {
   const { server, projectName, accessToken } = usePackage();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["connections", server, projectName],
      queryFn: () =>
         connectionsApi.listConnections(projectName, {
            baseURL: server,
            withCredentials: !accessToken,
            headers: {
               Authorization: accessToken && `Bearer ${accessToken}`,
            },
         }),
   });

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
                  <ApiErrorDisplay
                     error={error}
                     context={`${projectName} > Connections`}
                  />
               )}
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
