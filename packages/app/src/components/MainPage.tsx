import {
   BrowserNotebookStorage,
   NotebookStorageProvider,
   useRouterClickHandler,
} from "@malloy-publisher/sdk";
import { Add, Analytics, Launch } from "@mui/icons-material";
import {
   AppBar,
   Box,
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
   Toolbar,
   Typography,
} from "@mui/material";
import Container from "@mui/material/Container";
import React from "react";
import { Outlet, useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";
import { MutableNotebookList } from "./MutableNotebookList";

export default function MainPage() {
   const { projectName, packageName } = useParams();
   const navigate = useRouterClickHandler();

   const [workbookName, setWorkbookName] = React.useState("");
   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
   const [newDialogOpen, setNewDialogOpen] = React.useState(false);
   const [openDialogOpen, setOpenDialogOpen] = React.useState(false);
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
      navigate(
         `/${projectName}/${packageName}/scratchNotebook/${encodeURIComponent(notebook)}`,
         event,
      );
   };

   const createNotebookClick = (event?: React.MouseEvent) => {
      setNewDialogOpen(false);
      navigate(
         `/${projectName}/${packageName}/scratchNotebook/${encodeURIComponent(workbookName)}`,
         event,
      );
      setWorkbookName("");
   };

   return (
      <Box
         sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
         {/* Modern Header */}
         <AppBar
            position="sticky"
            elevation={0}
            sx={{
               backgroundColor: "background.paper",
               borderBottom: "1px solid",
               borderColor: "divider",
            }}
         >
            <Toolbar sx={{ justifyContent: "space-between" }}>
               <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     <Box
                        component="img"
                        src="/logo.svg"
                        alt="Malloy"
                        sx={{
                           width: 28,
                           height: 28,
                        }}
                     />
                     <Typography
                        variant="h5"
                        sx={{
                           color: "text.primary",
                           fontWeight: 700,
                           letterSpacing: "-0.025em",
                        }}
                     >
                        Malloy Publisher
                     </Typography>
                  </Box>
                  <BreadcrumbNav />
               </Stack>

               <Stack direction="row" spacing={2} alignItems="center">
                  {!projectName || !packageName ? (
                     <>
                        <Button href="https://malloydata.dev/">
                           Malloy Docs
                        </Button>
                        <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                           Publisher Docs
                        </Button>
                     </>
                  ) : (
                     <>
                        <Button
                           aria-controls={open ? "basic-menu" : undefined}
                           aria-haspopup="true"
                           aria-expanded={open ? "true" : undefined}
                           onClick={handleClick}
                           variant="contained"
                           startIcon={<Analytics />}
                           size="small"
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
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                 >
                                    Create a new analysis workbook
                                 </Typography>
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
                                 <Typography variant="body2" fontWeight={500}>
                                    Open Workbook
                                 </Typography>
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                 >
                                    Open an existing workbook
                                 </Typography>
                              </ListItemText>
                           </MenuItem>
                        </Menu>
                     </>
                  )}
               </Stack>
            </Toolbar>
         </AppBar>

         {/* Main Content */}
         <Container
            maxWidth="xl"
            component="main"
            sx={{
               flex: 1,
               display: "flex",
               flexDirection: "column",
               py: 2,
               gap: 2,
            }}
         >
            {/* Page Content */}
            <Box sx={{ flex: 1 }}>
               <Outlet />
            </Box>
         </Container>

         {/* Dialogs */}
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
                     project: projectName || "",
                     package: packageName || "",
                  }}
               >
                  <MutableNotebookList onNotebookClick={handleNotebookClick} />
               </NotebookStorageProvider>
            </DialogContent>
         </Dialog>
      </Box>
   );
}
