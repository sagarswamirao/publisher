import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { Edit } from "@mui/icons-material";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Project } from "../../client";
import {
   generateProjectReadme,
   getProjectDescription,
} from "../../utils/parsing";

interface EditProjectModalProps {
   project: Project;
   onCloseDialog: () => void;
}

export default function EditProjectDialog({ project, onCloseDialog }: EditProjectModalProps) {
   const [open, setOpen] = useState(false);

   const handleClickOpen = () => {
      setOpen(true);
   };

   const handleClose = () => {
      setOpen(false);
      onCloseDialog();
   };

   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const name = formData.get("name")?.toString();
      if (!name) {
        throw new Error("Name is required");
      }
      console.log({
         name,
         readme: generateProjectReadme(
            {
               name,
               readme: project.readme,
            },
            formData.get("description")?.toString(),
         ),
      });
      handleClose();
   };

   return (
      <React.Fragment>
         <MenuItem onClick={handleClickOpen}>
            <ListItemIcon>
               <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
         </MenuItem>

         <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Add a new project to start exploring semantic models and
                  analyzing data.
               </DialogContentText>
               <form onSubmit={handleSubmit} id="project-form">
                  <TextField
                     autoFocus
                     required
                     margin="dense"
                     id="name"
                     name="name"
                     label="Project Name"
                     type="text"
                     fullWidth
                     variant="standard"
                     defaultValue={project.name}
                  />
                  <TextField
                     margin="dense"
                     id="description"
                     name="description"
                     label="Project Description"
                     type="text"
                     fullWidth
                     variant="standard"
                     defaultValue={getProjectDescription(project.readme)}
                  />
               </form>
            </DialogContent>
            <DialogActions>
               <Button onClick={handleClose}>Cancel</Button>
               <Button type="submit" form="project-form">
                  Save Changes
               </Button>
            </DialogActions>
         </Dialog>
      </React.Fragment>
   );
}
