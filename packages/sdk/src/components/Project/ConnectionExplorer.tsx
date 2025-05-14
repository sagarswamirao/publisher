import React from "react";
import {
   Box,
   List,
   ListItemButton,
   ListItemText,
   Typography,
   Divider,
   Paper,
   Grid,
   Dialog,
   DialogContent,
   DialogTitle,
   IconButton,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
} from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ConnectionsApi } from "../../client/api";
import { Configuration } from "../../client/configuration";
import TablesInSchema from "./TablesInSchema";

const connectionsApi = new ConnectionsApi(new Configuration());
const queryClient = new QueryClient();

interface ConnectionExplorerProps {
   server?: string;
   projectName: string;
   connectionName: string;
   accessToken?: string;
}

export default function ConnectionExplorer({
   server,
   projectName,
   connectionName,
   accessToken,
}: ConnectionExplorerProps) {
   const [selectedTable, setSelectedTable] = React.useState<string | undefined>(
      undefined,
   );
   const [selectedSchema, setSelectedSchema] = React.useState<string | null>(
      null,
   );
   const { data, isSuccess, isError, error, isLoading } = useQuery(
      {
         queryKey: ["tablePath", server, projectName, connectionName],
         queryFn: () =>
            connectionsApi.listSchemas(projectName, connectionName, {
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
      <Grid container spacing={2}>
         <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
               <Typography variant="overline" fontWeight="bold">
                  Table Paths
               </Typography>
               <Divider />
               <Box sx={{ mt: "10px", maxHeight: "600px", overflowY: "auto" }}>
                  {isLoading && (
                     <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
                        Fetching Table Paths...
                     </Typography>
                  )}
                  {isError && (
                     <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                        {`${projectName} > ${connectionName} - ${error.message}`}
                     </Typography>
                  )}
                  {isSuccess && data.data.length === 0 && (
                     <Typography variant="body2">No Schemas</Typography>
                  )}
                  {isSuccess && data.data.length > 0 && (
                     <List dense disablePadding>
                        {data.data.map((schema: { name: string }) => (
                           <ListItemButton
                              key={schema.name}
                              selected={selectedSchema === schema.name}
                              onClick={() => setSelectedSchema(schema.name)}
                           >
                              <ListItemText primary={schema.name} />
                           </ListItemButton>
                        ))}
                     </List>
                  )}
               </Box>
            </Paper>
         </Grid>
         <Grid size={{ xs: 12, md: 6 }}>
            {selectedSchema && (
               <Paper sx={{ p: 2 }}>
                  <TablesInSchema
                     server={server}
                     projectName={projectName}
                     connectionName={connectionName}
                     schemaName={selectedSchema}
                     accessToken={accessToken}
                     onTableClick={(tableName) => {
                        setSelectedTable(tableName);
                     }}
                  />
               </Paper>
            )}
         </Grid>
         {selectedTable && (
            <TableViewer
               server={server}
               projectName={projectName}
               connectionName={connectionName}
               schemaName={selectedSchema}
               tableName={selectedTable}
               accessToken={accessToken}
               onClose={() => setSelectedTable(undefined)}
            />
         )}
      </Grid>
   );
}

type TableViewerProps = {
   server: string;
   projectName: string;
   connectionName: string;
   schemaName: string;
   tableName: string;
   accessToken: string;
   onClose: () => void;
};
function TableViewer({
   server,
   projectName,
   connectionName,
   schemaName,
   tableName,
   accessToken,
   onClose,
}: TableViewerProps) {
   const { data, isSuccess, isError, error, isLoading } = useQuery(
      {
         queryKey: [
            "tablePathSchema",
            server,
            projectName,
            connectionName,
            schemaName,
            tableName,
         ],
         queryFn: () =>
            connectionsApi.getTablesource(
               projectName,
               connectionName,
               `${schemaName}.${tableName}`,
               {
                  baseURL: server,
                  withCredentials: !accessToken,
                  headers: {
                     Authorization: accessToken && `Bearer ${accessToken}`,
                  },
               },
            ),
         retry: false,
      },
      queryClient,
   );
   if (isSuccess && data) {
      console.log(data);
   }
   return (
      // TODO(jjs) - Add a min height to the dialog, so when it loads the UI is not so jarring.
      <Dialog open={true} onClose={onclose} maxWidth="sm" fullWidth>
         <DialogTitle>
            Table: {schemaName}.{tableName}
            <Typography
               fontSize="large"
               variant="body2"
               fontFamily="monospace"
               component="span"
            ></Typography>
            <IconButton
               aria-label="close"
               onClick={onClose}
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
            <TableContainer>
               <Table
                  size="small"
                  sx={{ "& .MuiTableCell-root": { padding: "10px" } }}
               >
                  <TableHead>
                     <TableRow>
                        <TableCell>NAME</TableCell>
                        <TableCell>TYPE</TableCell>
                     </TableRow>
                  </TableHead>
                  <TableBody>
                     {isSuccess &&
                        data &&
                        data.data.columns.map((row) => (
                           <TableRow key={row.name}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.type}</TableCell>
                           </TableRow>
                        ))}
                     {isLoading && <div>Loading...</div>}
                     {isError && <div>Error: {error.message}</div>}
                  </TableBody>
               </Table>
            </TableContainer>
         </DialogContent>
      </Dialog>
   );
}
