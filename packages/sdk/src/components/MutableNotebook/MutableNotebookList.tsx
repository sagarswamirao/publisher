import {
   Button,
   Dialog,
   DialogActions,
   DialogContent,
   DialogContentText,
   DialogTitle,
   Divider,
   Table,
   TableBody,
   TableCell,
   TableRow,
   Typography,
} from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StyledCard, StyledCardContent } from "../styles";
import { useNotebookStorage } from "./NotebookStorageProvider";

export function MutableNotebookList() {
   const { projectName, packageName } = useParams();
   const navigate = useNavigate();
   const { notebookStorage, userContext } = useNotebookStorage();
   const [notebooks, setNotebooks] = React.useState<string[]>([]);
   const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
   const [notebookToDelete, setNotebookToDelete] = React.useState<
      string | null
   >(null);

   React.useEffect(() => {
      if (notebookStorage && userContext) {
         setNotebooks(notebookStorage.listNotebooks(userContext));
      }
   }, [notebookStorage, userContext]);

   const handleDeleteClick = (notebook: string) => {
      setNotebookToDelete(notebook);
      setDeleteDialogOpen(true);
   };

   const handleDeleteConfirm = () => {
      if (notebookToDelete && notebookStorage && userContext) {
         notebookStorage.deleteNotebook(userContext, notebookToDelete);
         setNotebooks(notebookStorage.listNotebooks(userContext));
      }
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
   };

   const handleDeleteCancel = () => {
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
   };

   const handleNotebookClick = (notebook: string) => {
      if (projectName && packageName) {
         // Navigate to the ScratchNotebookPage with anchor text for notebookPath
         navigate(
            `/${projectName}/${packageName}/scratchNotebook#notebookPath=${encodeURIComponent(notebook)}`,
         );
      }
   };

   return (
      <StyledCard
         variant="outlined"
         sx={{ padding: "10px", width: "400px", mt: "10px" }}
      >
         <StyledCardContent>
            <Typography variant="overline" fontWeight="bold">
               Notebook Analyses
            </Typography>
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
                        <TableCell sx={{ width: "200px", cursor: "pointer" }}>
                           {notebook}
                        </TableCell>
                        <TableCell
                           onClick={() => handleNotebookClick(notebook)}
                           sx={{ width: "20px", cursor: "pointer" }}
                        >
                           <Button variant="text" size="small">
                              View
                           </Button>
                        </TableCell>
                        <TableCell
                           onClick={() => handleDeleteClick(notebook)}
                           sx={{ cursor: "pointer" }}
                        >
                           <Button variant="text" size="small">
                              Delete
                           </Button>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
               <DialogTitle>Delete Notebook</DialogTitle>
               <DialogContent>
                  <DialogContentText>
                     Are you sure you want to delete the notebook &quot;
                     {notebookToDelete}&quot;? This action cannot be undone.
                  </DialogContentText>
               </DialogContent>
               <DialogActions>
                  <Button onClick={handleDeleteCancel} color="primary">
                     Cancel
                  </Button>
                  <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                     Delete
                  </Button>
               </DialogActions>
            </Dialog>
         </StyledCardContent>
      </StyledCard>
   );
}
