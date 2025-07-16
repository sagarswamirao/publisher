import {
   Box,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableRow,
   Typography,
   Dialog,
   DialogTitle,
   DialogContent,
   IconButton,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Configuration, ConnectionsApi } from "../../client";
import { Connection as ApiConnection } from "../../client/api";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { StyledCard, StyledCardContent } from "../styles";
import { usePackage } from "./PackageProvider";
import ConnectionExplorer from "../Project/ConnectionExplorer";
import { useState } from "react";
import { ProjectProvider } from "../Project";

const connectionsApi = new ConnectionsApi(new Configuration());

// TODO(jjs) - Move this UI to the ConnectionExplorer component
function Connection({
   connection,
   onClick,
}: {
   connection: ApiConnection;
   onClick: () => void;
}) {
   return (
      <TableRow
         key={connection.name}
         onClick={onClick}
         sx={{
            cursor: "pointer",
            "&:hover": {
               backgroundColor: "action.hover",
            },
         }}
      >
         <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <Typography variant="body2">{connection.name}</Typography>
               <OpenInNewIcon
                  sx={{
                     fontSize: "1rem",
                     color: "action.active",
                     opacity: 0.7,
                  }}
               />
            </Box>
         </TableCell>
         <TableCell>
            <Typography variant="body2">{connection.type}</Typography>
         </TableCell>
      </TableRow>
   );
}

export default function Connections() {
   const { projectName } = usePackage();
   const [selectedConnection, setSelectedConnection] = useState<string | null>(
      null,
   );

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["connections", projectName],
      queryFn: (config) => connectionsApi.listConnections(projectName, config),
   });

   const handleConnectionClick = (connectionName: string) => {
      setSelectedConnection(connectionName);
   };

   const handleCloseDialog = () => {
      setSelectedConnection(null);
   };

   return (
      // Connections are project-scoped, so we need to provide the project name to the ConnectionExplorer
      <ProjectProvider projectName={projectName}>
         <StyledCard variant="outlined" sx={{ width: "100%" }}>
            <StyledCardContent>
               <Typography variant="overline" fontWeight="bold">
                  Database Connections
               </Typography>
               <Divider />
               <Box
                  sx={{
                     maxHeight: "200px",
                     overflowY: "auto",
                  }}
               >
                  {!isSuccess && !isError && (
                     <Typography variant="body2" sx={{ m: "auto" }}>
                        Fetching Connections...
                     </Typography>
                  )}
                  {isSuccess && data.data.length > 0 && (
                     <Table size="small">
                        <TableBody>
                           <TableRow>
                              <TableCell>
                                 <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                 >
                                    Connection Name
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                 >
                                    Type
                                 </Typography>
                              </TableCell>
                           </TableRow>
                           {data.data.map((conn) => (
                              <Connection
                                 key={conn.name}
                                 connection={conn}
                                 onClick={() =>
                                    handleConnectionClick(conn.name)
                                 }
                              />
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

         {/* Connection Explorer Dialog */}
         <Dialog
            open={selectedConnection !== null}
            onClose={handleCloseDialog}
            maxWidth="lg"
            fullWidth
         >
            <DialogTitle>
               Connection Explorer: {selectedConnection}
               <IconButton
                  aria-label="close"
                  onClick={handleCloseDialog}
                  sx={{ position: "absolute", right: 8, top: 8 }}
               >
                  <Box
                     sx={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                     }}
                  >
                     X
                  </Box>
               </IconButton>
            </DialogTitle>
            <DialogContent>
               {selectedConnection && (
                  <ConnectionExplorer connectionName={selectedConnection} />
               )}
            </DialogContent>
         </Dialog>
      </ProjectProvider>
   );
}
