import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { AddCircleRounded } from '@mui/icons-material';
import { generateProjectReadme } from '../../utils/parsing';

export default function AddProjectDialog() {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    if (!name) {
      throw new Error("Name is required");
    }
    console.log({
      name,
      readme: generateProjectReadme(
         {
            name,
            readme: "",
         },
         description,
      ),
   });
    handleClose();
  };

  return (
    <React.Fragment>
      <Button variant="contained" onClick={handleClickOpen} startIcon={<AddCircleRounded />} sx={{ mt: 2, color: "white" }}>
        Create New Project
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
          Add a new project to start exploring semantic models and analyzing data.
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
            />
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Project Description"
              type="text"
              fullWidth
              variant="standard"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="project-form">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
