import { useNotebookStorage } from "@malloy-publisher/sdk";
import { Divider, Table, TableBody, TableCell, TableRow } from "@mui/material";
import React from "react";

interface MutableNotebookListProps {
   onNotebookClick: (notebook: string) => void;
}

export function MutableNotebookList({
   onNotebookClick,
}: MutableNotebookListProps) {
   const { notebookStorage, userContext } = useNotebookStorage();
   const [notebooks, setNotebooks] = React.useState<string[]>([]);

   React.useEffect(() => {
      if (notebookStorage && userContext) {
         setNotebooks(notebookStorage.listNotebooks(userContext));
      }
   }, [notebookStorage, userContext]);

   return (
      <>
         <Divider />
         <Table size="small">
            <TableBody>
               {notebooks.length === 0 && (
                  <TableRow>
                     <TableCell>No notebooks found.</TableCell>
                     <TableCell></TableCell>
                  </TableRow>
               )}
               {notebooks.map((notebook) => (
                  <TableRow key={notebook}>
                     <TableCell
                        onClick={() => onNotebookClick(notebook)}
                        sx={{ width: "200px", cursor: "pointer" }}
                     >
                        {notebook}
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </>
   );
}
