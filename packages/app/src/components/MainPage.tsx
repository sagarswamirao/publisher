import {
   BrowserNotebookStorage,
   NotebookStorageProvider,
   useRouterClickHandler,
} from "@malloy-publisher/sdk";
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
} from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
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
      <Container
         maxWidth="xl"
         component="main"
         sx={{ display: "flex", flexDirection: "column", my: 2, gap: 0 }}
      >
         <Stack
            sx={{
               display: "flex",
               flexDirection: "row",
               gap: 0,
               justifyContent: "space-between",
               alignItems: "center",
            }}
         >
            <div>
               <Typography variant="h4" sx={{ color: "text.primary" }}>
                  Malloy Publisher
               </Typography>
            </div>
            <Stack
               sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
               }}
            >
               {!(projectName && packageName) ? (
                  <>
                     <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                        Getting Started
                     </Button>
                     <Button href="/api-doc.html">API</Button>
                     <Button href="https://malloydata.dev/">Malloy</Button>
                  </>
               ) : (
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
                              <Typography variant="body2">
                                 New Workbook
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
                              <Typography variant="body2">
                                 Open Workbook
                              </Typography>
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
                        <DialogTitle
                           variant="subtitle1"
                           sx={{ fontWeight: "medium" }}
                        >
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
                                 onChange={(e) =>
                                    setWorkbookName(e.target.value)
                                 }
                                 sx={{
                                    width: "100%",
                                    maxWidth: "400px",
                                    mt: 1,
                                 }}
                              />
                              <Button
                                 onClick={(event) => createNotebookClick(event)}
                              >
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
                        <DialogTitle
                           variant="subtitle1"
                           sx={{ fontWeight: "medium" }}
                        >
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
                              <MutableNotebookList
                                 onNotebookClick={handleNotebookClick}
                              />
                           </NotebookStorageProvider>
                        </DialogContent>
                     </Dialog>
                  </>
               )}
            </Stack>
         </Stack>
         <Stack
            sx={{
               display: "flex",
               flexDirection: { xs: "column-reverse", md: "row" },
               width: "100%",
               justifyContent: "space-between",
               alignItems: { xs: "start", md: "center" },
               gap: 4,
               overflow: "auto",
               marginBottom: "15px",
            }}
         >
            <BreadcrumbNav />
         </Stack>
         <Outlet />
      </Container>
   );
}
