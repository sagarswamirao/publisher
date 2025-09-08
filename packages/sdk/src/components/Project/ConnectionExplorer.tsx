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
   Switch,
   FormControlLabel,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tooltip,
} from "@mui/material";
import { ConnectionsApi } from "../../client/api";
import { Configuration } from "../../client/configuration";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { parseResourceUri } from "../../utils/formatting";
import { useApiClients } from "../ServerProvider";

interface ConnectionExplorerProps {
   connectionName: string;
   schema?: string;
   resourceUri: string;
}

export default function ConnectionExplorer({
   connectionName,
   resourceUri,
   schema,
}: ConnectionExplorerProps) {
   const { connections } = useApiClients();
   const { projectName: projectName } = parseResourceUri(resourceUri);
   const [selectedTable, setSelectedTable] = React.useState<string | undefined>(
      undefined,
   );
   const [selectedSchema, setSelectedSchema] = React.useState<string | null>(
      schema || null,
   );
   const [showHiddenSchemas, setShowHiddenSchemas] = React.useState(false);
   const { data, isSuccess, isError, error, isLoading } = useQueryWithApiError({
      queryKey: ["tablePath", projectName, connectionName],
      queryFn: () => connections.listSchemas(projectName, connectionName),
   });

   return (
      <Grid container spacing={1}>
         {!schema && (
            <Grid size={{ xs: 12, md: 4 }}>
               <Paper sx={{ p: 1, m: 0 }}>
                  <Box
                     sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 0,
                     }}
                  >
                     <Typography variant="overline" fontWeight="bold">
                        Table Paths
                     </Typography>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={showHiddenSchemas}
                              onChange={(e) =>
                                 setShowHiddenSchemas(e.target.checked)
                              }
                           />
                        }
                        label="Hidden Schemas"
                     />
                  </Box>
                  <Divider sx={{ mt: "2px" }} />
                  <Box
                     sx={{ mt: "2px", maxHeight: "600px", overflowY: "auto" }}
                  >
                     {isLoading && <Loading text="Fetching Table Paths..." />}
                     {isError && (
                        <ApiErrorDisplay
                           error={error}
                           context={`${projectName} > ${connectionName}`}
                        />
                     )}
                     {isSuccess && data.data.length === 0 && (
                        <Typography variant="body2">No Schemas</Typography>
                     )}
                     {isSuccess && data.data.length > 0 && (
                        <List dense disablePadding>
                           {data.data
                              .filter(
                                 ({ isHidden }) =>
                                    showHiddenSchemas || !isHidden,
                              )
                              .sort((a, b) => {
                                 if (a.isDefault === b.isDefault) return 0;
                                 return a.isDefault ? -1 : 1;
                              })
                              .map(
                                 (schema: {
                                    name: string;
                                    isDefault: boolean;
                                    description?: string;
                                 }) => {
                                    const fullDescription = (
                                       schema.description || ""
                                    ).trim();
                                    const hasDescription =
                                       fullDescription !== "";
                                    const firstLine = hasDescription
                                       ? fullDescription.split(/\r?\n/)[0]
                                       : undefined;

                                    const item = (
                                       <ListItemButton
                                          key={schema.name}
                                          selected={
                                             selectedSchema === schema.name
                                          }
                                          onClick={() =>
                                             setSelectedSchema(schema.name)
                                          }
                                       >
                                          <ListItemText
                                             primary={schema.name}
                                             secondary={firstLine}
                                          />
                                       </ListItemButton>
                                    );

                                    return hasDescription ? (
                                       <Tooltip
                                          key={schema.name}
                                          title={fullDescription}
                                          arrow
                                       >
                                          {item}
                                       </Tooltip>
                                    ) : (
                                       item
                                    );
                                 },
                              )}
                        </List>
                     )}
                  </Box>
               </Paper>
            </Grid>
         )}
         <Grid size={{ xs: 12, md: schema ? 6 : 4 }}>
            {selectedSchema && (
               <Paper sx={{ p: 1, m: 0 }}>
                  <TablesInSchema
                     connectionName={connectionName}
                     schemaName={selectedSchema}
                     onTableClick={(tableName) => {
                        setSelectedTable(tableName);
                     }}
                     resourceUri={resourceUri}
                  />
               </Paper>
            )}
         </Grid>
         <Grid size={{ xs: 12, md: schema ? 6 : 4 }}>
            {selectedTable && selectedSchema && (
               <Paper sx={{ p: 1, m: 0 }}>
                  <TableSchemaViewer
                     connectionName={connectionName}
                     schemaName={selectedSchema}
                     tableName={selectedTable}
                     resourceUri={resourceUri}
                  />
               </Paper>
            )}
         </Grid>
      </Grid>
   );
}

type TableSchemaViewerProps = {
   connectionName: string;
   schemaName: string;
   tableName: string;
   resourceUri: string;
};

function TableSchemaViewer({
   connectionName,
   schemaName,
   tableName,
   resourceUri,
}: TableSchemaViewerProps) {
   const { connections } = useApiClients();
   const { projectName: projectName } = parseResourceUri(resourceUri);
   const { data, isSuccess, isError, error, isLoading } = useQueryWithApiError({
      queryKey: [
         "tablePathSchema",
         projectName,
         connectionName,
         schemaName,
         tableName,
      ],
      queryFn: () =>
         connections.getTablesource(
            projectName,
            connectionName,
            tableName,
            `${schemaName}.${tableName}`,
         ),
   });

   return (
      <>
         <Typography variant="overline" fontWeight="bold">
            Schema: {schemaName}.{tableName}
         </Typography>
         <Divider />
         <Box sx={{ mt: "10px", maxHeight: "600px", overflowY: "auto" }}>
            {isLoading && <Loading text="Fetching Table Details..." />}
            {isError && (
               <ApiErrorDisplay
                  error={error}
                  context={`${projectName} > ${connectionName} > ${schemaName}.${tableName}`}
               />
            )}
            {isSuccess && data && (
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
                        {data.data.columns?.map(
                           (column: { name: string; type: string }) => (
                              <TableRow key={column.name}>
                                 <TableCell>{column.name}</TableCell>
                                 <TableCell>{column.type}</TableCell>
                              </TableRow>
                           ),
                        )}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Box>
      </>
   );
}

interface TablesInSchemaProps {
   connectionName: string;
   schemaName: string;
   onTableClick: (tableName: string) => void;
   resourceUri: string;
}

function TablesInSchema({
   connectionName,
   schemaName,
   onTableClick,
   resourceUri,
}: TablesInSchemaProps) {
   const { projectName: projectName } = parseResourceUri(resourceUri);
   const { connections } = useApiClients();
   const { data, isSuccess, isError, error, isLoading } = useQueryWithApiError({
      queryKey: ["tablesInSchema", projectName, connectionName, schemaName],
      queryFn: () =>
         connections.listTables(projectName, connectionName, schemaName),
   });

   return (
      <>
         <Typography variant="overline" fontWeight="bold">
            Tables in {schemaName}
         </Typography>
         <Divider />
         <Box sx={{ mt: "2px", maxHeight: "600px", overflowY: "auto" }}>
            {isLoading && <Loading text="Fetching Tables..." />}
            {isError && (
               <ApiErrorDisplay
                  error={error}
                  context={`${projectName} > ${connectionName} > ${schemaName}`}
               />
            )}
            {isSuccess && data.data.length === 0 && (
               <Typography variant="body2">No Tables</Typography>
            )}
            {isSuccess && data.data.length > 0 && (
               <List dense disablePadding>
                  {data.data.map((tableName: string) => (
                     <ListItemButton
                        key={tableName}
                        onClick={() => onTableClick(tableName)}
                     >
                        <ListItemText primary={tableName} />
                     </ListItemButton>
                  ))}
               </List>
            )}
         </Box>
      </>
   );
}
