import React from "react";
import {
   Box,
   List,
   ListItemButton,
   ListItemText,
   Typography,
   Divider,
} from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Configuration, ConnectionsApi } from "../../client";

const connectionsApi = new ConnectionsApi(new Configuration());
const queryClient = new QueryClient();

interface TablesInSchemaProps {
   server?: string;
   projectName: string;
   connectionName: string;
   schemaName: string;
   accessToken: string;
   onTableClick?: (tableName: string) => void;
}

export default function TablesInSchema({
   server,
   projectName,
   connectionName,
   schemaName,
   accessToken,
   onTableClick,
}: TablesInSchemaProps) {
   const { data, isSuccess, isError, error, isLoading } = useQuery(
      {
         queryKey: ["tables", server, projectName, connectionName, schemaName],
         queryFn: () =>
            connectionsApi.listTables(projectName, connectionName, schemaName, {
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
      <Box sx={{ width: "100%" }}>
         <Typography variant="overline" fontWeight="bold">
            Tables in {schemaName}
         </Typography>
         <Divider />
         <Box sx={{ mt: "10px", maxHeight: "200px", overflowY: "auto" }}>
            {isLoading && (
               <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
                  Fetching Tables...
               </Typography>
            )}
            {isError && (
               <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                  {`${projectName} > ${connectionName} > ${schemaName} - ${error.message}`}
               </Typography>
            )}
            {isSuccess && data.data.length === 0 && (
               <Typography variant="body2">No Tables</Typography>
            )}
            {isSuccess && data.data.length > 0 && (
               <List dense disablePadding>
                  {data.data.map((table: string) => (
                     <ListItemButton
                        key={table}
                        onClick={() => onTableClick && onTableClick(table)}
                     >
                        <ListItemText primary={table} />
                     </ListItemButton>
                  ))}
               </List>
            )}
         </Box>
      </Box>
   );
}
