import { Add, Launch } from "@mui/icons-material";
import {
   Button,
   Dialog,
   DialogContent,
   DialogTitle,
   FormControl,
   ListItemIcon,
   ListItemText,
   Menu,
   MenuItem,
   Stack,
   TextField,
   Typography,
} from "@mui/material";
import React from "react";
import { useRouterClickHandler } from "./click_helper";
import {
   BrowserNotebookStorage,
   MutableNotebookList,
   NotebookStorageProvider,
} from "./MutableNotebook";
import { useParams } from "react-router-dom";

export function AnalyzePackageButton() {
   const { projectName, packageName } = useParams();
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

   if (!projectName || !packageName) {
      return null;
   }
   return (
      <>
         <Button
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            variant="contained"
            sx={{
               height: "40px",
               px: 2,
               backgroundColor: "#fbbb04",
               "&:hover": {
                  backgroundColor: "#eab308",
               },
            }}
         >
            Analyze Package
         </Button>
         <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
               "aria-labelledby": "basic-button",
               sx: { py: 0.5 },
            }}
         >
            <MenuItem
               onClick={() => {
                  setNewDialogOpen(true);
                  handleMenuClose();
               }}
               sx={{ py: 1, px: 2 }}
            >
               <ListItemIcon>
                  <Add fontSize="small" />
               </ListItemIcon>
               <ListItemText>
                  <Typography variant="body2" fontWeight={500}>
                     New Workbook
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Create a new analysis workbook
                  </Typography>
               </ListItemText>
            </MenuItem>
            <MenuItem
               onClick={() => {
                  setOpenDialogOpen(true);
                  handleMenuClose();
               }}
               sx={{ py: 1, px: 2 }}
            >
               <ListItemIcon>
                  <Launch fontSize="small" />
               </ListItemIcon>
               <ListItemText>
                  <Typography variant="body2" fontWeight={500}>
                     Open Workbook
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Open an existing workbook
                  </Typography>
               </ListItemText>
            </MenuItem>
         </Menu>

         {/* Create New Workbook Dialog */}
         <Dialog
            open={newDialogOpen}
            onClose={handleNewDialogClose}
            maxWidth="sm"
            fullWidth
         >
            <DialogTitle sx={{ pb: 1, pt: 2, px: 2 }}>
               <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Create New Workbook
               </Typography>
               <Typography variant="body2" color="text.secondary">
                  Start a new analysis workbook to explore your data
               </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pb: 2 }}>
               <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth>
                     <TextField
                        label="Workbook Name"
                        value={workbookName}
                        onChange={(e) => setWorkbookName(e.target.value)}
                        placeholder="Enter workbook name..."
                        fullWidth
                        autoFocus
                        size="small"
                     />
                  </FormControl>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                     <Button
                        onClick={handleNewDialogClose}
                        variant="outlined"
                        size="small"
                     >
                        Cancel
                     </Button>
                     <Button
                        onClick={(event) => createNotebookClick(event)}
                        variant="contained"
                        disabled={!workbookName.trim()}
                        size="small"
                     >
                        Create Workbook
                     </Button>
                  </Stack>
               </Stack>
            </DialogContent>
         </Dialog>

         {/* Open Workbook Dialog */}
         <Dialog
            open={openDialogOpen}
            onClose={handleOpenDialogClose}
            maxWidth="md"
            fullWidth
         >
            <DialogTitle sx={{ pb: 1, pt: 2, px: 2 }}>
               <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Open Workbook
               </Typography>
               <Typography variant="body2" color="text.secondary">
                  Select an existing workbook to continue your analysis
               </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pb: 2 }}>
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
