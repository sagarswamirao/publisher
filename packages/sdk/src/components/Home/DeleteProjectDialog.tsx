import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { Project } from "../../client";


export default function DeleteProjectDialog({ project, onCloseDialog }: { project: Project, onCloseDialog: () => void }) {
   const [open, setOpen] = useState(false);

   const handleClickOpen = () => {
      setOpen(true);
   };
   const handleClose = () => {
      setOpen(false);
      onCloseDialog();
   };

   return (
      <React.Fragment>
         <MenuItem onClick={handleClickOpen}>
            <ListItemIcon>
               <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
         </MenuItem>
         <Dialog
            onClose={handleClose}
            aria-labelledby="customized-dialog-title"
            open={open}
         >
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
               Delete Project
            </DialogTitle>
            <IconButton
               aria-label="close"
               onClick={handleClose}
               sx={(theme) => ({
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: theme.palette.grey[500],
               })}
            >
               <CloseIcon />
            </IconButton>
            <DialogContent dividers>
               <Typography gutterBottom>
                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
               </Typography>
            </DialogContent>
            <DialogActions>
               <Button variant="contained" autoFocus onClick={handleClose} color="error">
                  Delete
               </Button>
            </DialogActions>
         </Dialog>
      </React.Fragment>
   );
}
