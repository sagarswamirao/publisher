import {
   Box,
   Dialog,
   DialogContent,
   DialogTitle,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Typography,
} from "@mui/material";
import React from "react";
import { Configuration, Database, DatabasesApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { usePackage } from "./PackageProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const databasesApi = new DatabasesApi(new Configuration());

export default function Databases() {
   const { projectName, packageName, versionId } = usePackage();

   const [open, setOpen] = React.useState(false);
   const [selectedDatabase, setSelectedDatabase] =
      React.useState<Database | null>(null);

   const handleOpen = (database: Database) => {
      setSelectedDatabase(database);
      setOpen(true);
   };

   const handleClose = () => {
      setOpen(false);
      setSelectedDatabase(null);
   };

   const { data, isError, error, isSuccess } = useQueryWithApiError({
      queryKey: ["databases", projectName, packageName, versionId],
      queryFn: (config) =>
         databasesApi.listDatabases(
            projectName,
            packageName,
            versionId,
            config,
         ),
   });
   const formatRowSize = (size: number) => {
      if (size >= 1024 * 1024 * 1024 * 1024) {
         return `${(size / (1024 * 1024 * 1024)).toFixed(2)} T`;
      } else if (size >= 1024 * 1024 * 1024) {
         return `${(size / (1024 * 1024 * 1024)).toFixed(2)} G`;
      } else if (size >= 1024 * 1024) {
         return `${(size / (1024 * 1024)).toFixed(2)} M`;
      } else {
         return `${(size / 1024).toFixed(2)} K`;
      }
   };
   return (
      <>
         <StyledCard variant="outlined" sx={{ padding: "10px", width: "100%" }}>
            <StyledCardContent>
               <Typography variant="overline" fontWeight="bold">
                  Databases
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
                     <Loading text="Fetching Databases..." />
                  )}
                  {isError && (
                     <ApiErrorDisplay
                        error={error}
                        context={`${projectName} > ${packageName} > Databases`}
                     />
                  )}
                  {isSuccess && data.data.length > 0 && (
                     <Table size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Rows</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {data.data.map((database) => (
                              <TableRow
                                 key={database.path}
                                 onClick={() => handleOpen(database)}
                                 sx={{ cursor: "pointer" }}
                              >
                                 <TableCell component="th" scope="row">
                                    {database.path}
                                 </TableCell>
                                 <TableCell align="right">
                                    {formatRowSize(database.info.rowCount)}
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  )}
                  {isSuccess && data.data.length === 0 && (
                     <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
                        No databases found
                     </Typography>
                  )}
               </Box>
            </StyledCardContent>
         </StyledCard>

         <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{selectedDatabase?.path}</DialogTitle>
            <DialogContent>
               {selectedDatabase?.info?.columns && (
                  <TableContainer>
                     <Table size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell>Column</TableCell>
                              <TableCell>Type</TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {selectedDatabase.info.columns.map((column) => (
                              <TableRow key={column.name}>
                                 <TableCell component="th" scope="row">
                                    {column.name}
                                 </TableCell>
                                 <TableCell>{column.type}</TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </TableContainer>
               )}
            </DialogContent>
         </Dialog>
      </>
   );
}
