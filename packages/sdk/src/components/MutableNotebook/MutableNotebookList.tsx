import { Box, Divider, List, ListItem, ListItemText } from "@mui/material";
import React from "react";
import { useNotebookStorage } from "./NotebookStorageProvider";

interface MutableNotebookListProps {
   onNotebookClick: (notebook: string, event: React.MouseEvent) => void;
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
         <Box
            sx={{
               maxHeight: "300px",
               overflow: "auto",
               "&::-webkit-scrollbar": {
                  width: "8px",
               },
               "&::-webkit-scrollbar-track": {
                  background: "transparent",
               },
               "&::-webkit-scrollbar-thumb": {
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "4px",
               },
            }}
         >
            <List dense>
               {notebooks.length === 0 && (
                  <ListItem>
                     <ListItemText
                        primary="No notebooks found."
                        sx={{ textAlign: "center" }}
                     />
                  </ListItem>
               )}
               {notebooks.map((notebook) => (
                  <ListItem
                     key={notebook}
                     onClick={(event: React.MouseEvent) =>
                        onNotebookClick(notebook, event)
                     }
                     sx={{
                        cursor: "pointer",
                        "&:hover": {
                           backgroundColor: "action.hover",
                        },
                     }}
                  >
                     <ListItemText primary={notebook} />
                  </ListItem>
               ))}
            </List>
         </Box>
      </>
   );
}
