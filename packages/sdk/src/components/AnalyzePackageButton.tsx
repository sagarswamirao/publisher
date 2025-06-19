import { Add, Launch } from "@mui/icons-material";
import {
   Button,
   Menu,
   MenuItem,
   ListItemIcon,
   ListItemText,
   Typography,
   Dialog,
   DialogTitle,
   DialogContent,
   FormControl,
   TextField,
} from "@mui/material";
import {
   NotebookStorageProvider,
   BrowserNotebookStorage,
   MutableNotebookList,
} from "./MutableNotebook";
import React from "react";
import { useRouterClickHandler } from "./click_helper";

export interface AnalyzePackageButtonProps {
   projectName: string;
   packageName: string;
}

export function AnalyzePackageButton({
   projectName,
   packageName,
}: AnalyzePackageButtonProps) {
   const [workbookName, setWorkbookName] = React.useState("");
   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
   const [newDialogOpen, setNewDialogOpen] = React.useState(false);
   const [openDialogOpen, setOpenDialogOpen] = React.useState(false);
   const navigate = useRouterClickHandler();

   const open = Boolean(anchorEl);
   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
   };
   const handleMenuClose = () => {
      setAnchorEl(null);
   };
   const handleOpenDialogClose = () => {
      setOpenDialogOpen(false);
   };
   const handleNewDialogClose = () => {
      setNewDialogOpen(false);
   };

   const handleNotebookClick = (notebook: string, event: React.MouseEvent) => {
      setOpenDialogOpen(false);
      // Navigate to the ScratchNotebookPage with anchor text for notebookPath
      navigate(
         `/${projectName}/${packageName}/scratchNotebook/${encodeURIComponent(notebook)}`,
         event,
      );
   };

   const createNotebookClick = (event?: React.MouseEvent) => {
      setNewDialogOpen(false);
      // Navigate to the ScratchNotebookPage with anchor text for notebookPath
      navigate(
         `/${projectName}/${packageName}/scratchNotebook/${encodeURIComponent(workbookName)}`,
         event,
      );
      setWorkbookName("");
   };

   return (
      <>
         <Button
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            sx={{ height: "40px" }}
         >
            Analyze Package
         </Button>
         <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            slotProps={{
               list: {
                  "aria-labelledby": "basic-button",
               },
            }}
         >
            <MenuItem
               onClick={() => {
                  setNewDialogOpen(true);
                  handleMenuClose();
               }}
            >
               <ListItemIcon>
                  <Add fontSize="small" />
               </ListItemIcon>
               <ListItemText>
                  <Typography variant="body2">New Workbook</Typography>
               </ListItemText>
            </MenuItem>
            <MenuItem
               onClick={() => {
                  setOpenDialogOpen(true);
                  handleMenuClose();
               }}
            >
               <ListItemIcon>
                  <Launch fontSize="small" />
               </ListItemIcon>
               <ListItemText>
                  <Typography variant="body2">Open Workbook</Typography>
               </ListItemText>
            </MenuItem>
         </Menu>
         <Dialog
            open={newDialogOpen}
            onClose={handleNewDialogClose}
            sx={{
               "& .MuiDialog-paper": {
                  width: "100%",
                  maxWidth: "300px",
               },
            }}
         >
            <DialogTitle variant="subtitle1" sx={{ fontWeight: "medium" }}>
               Create Workbook
            </DialogTitle>
            <DialogContent>
               <FormControl
                  sx={{
                     width: "100%",
                     display: "flex",
                     alignItems: "center",
                     gap: 2,
                  }}
               >
                  <TextField
                     label="Workbook Name"
                     value={workbookName}
                     onChange={(e) => setWorkbookName(e.target.value)}
                     sx={{
                        width: "100%",
                        maxWidth: "400px",
                        mt: 1,
                     }}
                  />
                  <Button onClick={(event) => createNotebookClick(event)}>
                     Create
                  </Button>
               </FormControl>
            </DialogContent>
         </Dialog>
         <Dialog
            open={openDialogOpen}
            onClose={handleOpenDialogClose}
            sx={{
               "& .MuiDialog-paper": {
                  width: "100%",
                  maxWidth: "300px",
               },
            }}
         >
            <DialogTitle variant="subtitle1" sx={{ fontWeight: "medium" }}>
               Open Workbook
            </DialogTitle>
            <DialogContent>
               <NotebookStorageProvider
                  notebookStorage={new BrowserNotebookStorage()}
                  userContext={{
                     project: projectName,
                     package: packageName,
                  }}
               >
                  <MutableNotebookList onNotebookClick={handleNotebookClick} />
               </NotebookStorageProvider>
            </DialogContent>
         </Dialog>
      </>
   );
}
