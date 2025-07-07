import { Box, Divider, List, ListItem, ListItemText } from "@mui/material";
import React from "react";
import { useWorkbookStorage } from "./WorkbookStorageProvider";
import { usePackage } from "../Package";

interface WorkbookListProps {
   onWorkbookClick: (workbook: string, event: React.MouseEvent) => void;
}

export function WorkbookList({ onWorkbookClick }: WorkbookListProps) {
   const { workbookStorage } = useWorkbookStorage();
   const packageContext = usePackage();
   const [workbooks, setWorkbooks] = React.useState<string[]>([]);

   React.useEffect(() => {
      if (workbookStorage) {
         setWorkbooks(workbookStorage.listWorkbooks(packageContext));
      }
   }, [workbookStorage, packageContext]);

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
               {workbooks.length === 0 && (
                  <ListItem>
                     <ListItemText
                        primary="No workbooks found."
                        sx={{ textAlign: "center" }}
                     />
                  </ListItem>
               )}
               {workbooks.map((workbook) => (
                  <ListItem
                     key={workbook}
                     onClick={(event: React.MouseEvent) =>
                        onWorkbookClick(workbook, event)
                     }
                     sx={{
                        cursor: "pointer",
                        "&:hover": {
                           backgroundColor: "action.hover",
                        },
                     }}
                  >
                     <ListItemText primary={workbook} />
                  </ListItem>
               ))}
            </List>
         </Box>
      </>
   );
}
