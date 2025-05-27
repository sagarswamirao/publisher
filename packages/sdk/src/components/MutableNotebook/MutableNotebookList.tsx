import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
   List,
   ListItem,
   ListItemText,
   IconButton,
   Dialog,
   DialogTitle,
   DialogContent,
   DialogContentText,
   DialogActions,
   Button,
   Typography,
   Box,
   ListItemButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
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
            `/${projectName}/${packageName}/scratch_notebook#notebookPath=${encodeURIComponent(notebook)}`,
         );
      }
   };

   return (
      <Box>
         <Typography variant="h5" sx={{ mb: 2 }}>
            Notebooks
         </Typography>
         <Button
            variant="contained"
            onClick={() => handleNotebookClick("")}
            sx={{ mb: 2 }}
         >
            New Notebook
         </Button>

         <List>
            {notebooks.length === 0 && (
               <ListItem>
                  <ListItemText primary="No notebooks found." />
               </ListItem>
            )}
            {notebooks.map((notebook) => (
               <ListItem
                  key={notebook}
                  secondaryAction={
                     <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteClick(notebook);
                        }}
                     >
                        <DeleteIcon />
                     </IconButton>
                  }
                  disablePadding
               >
                  <ListItemButton onClick={() => handleNotebookClick(notebook)}>
                     <ListItemText
                        primary={
                           <Typography
                              component="span"
                              sx={{
                                 color: "primary.main",
                                 textDecoration: "underline",
                              }}
                           >
                              {notebook}
                           </Typography>
                        }
                     />
                  </ListItemButton>
               </ListItem>
            ))}
         </List>
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
      </Box>
   );
}
