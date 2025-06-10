import {
   BrowserNotebookStorage,
   NotebookStorageProvider,
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
import { Outlet, useNavigate, useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";
import { MutableNotebookList } from "./MutableNotebookList";

export default function MainPage() {
   const { projectName, packageName } = useParams();
   const navigate = useNavigate();

   const [analysisName, setAnalysisName] = React.useState("");
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

   const handleNotebookClick = (notebook: string) => {
      setOpenDialogOpen(false);
      // Navigate to the ScratchNotebookPage with anchor text for notebookPath
      navigate(
         `/projects/${projectName}/packages/${packageName}/scratchNotebook/${encodeURIComponent(notebook)}`,
      );
   };

   const createNotebookClick = () => {
      setNewDialogOpen(false);
      // Navigate to the ScratchNotebookPage with anchor text for notebookPath
      navigate(
         `/projects/${projectName}/packages/${packageName}/scratchNotebook/${encodeURIComponent(analysisName)}`,
      );
      setAnalysisName("");
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
                        variant="outlined"
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
                           <ListItemText>New Analysis</ListItemText>
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
                           <ListItemText>Open Analysis</ListItemText>
                        </MenuItem>
                     </Menu>
                     <Dialog
                        open={newDialogOpen}
                        onClose={handleNewDialogClose}
                        maxWidth="md"
                        fullWidth
                     >
                        <DialogTitle>New Analysis</DialogTitle>
                        <DialogContent>
                           <FormControl>
                              <TextField
                                 label="Analysis Name"
                                 value={analysisName}
                                 onChange={(e) =>
                                    setAnalysisName(e.target.value)
                                 }
                              />
                              <Button onClick={createNotebookClick}>
                                 Create
                              </Button>
                           </FormControl>
                        </DialogContent>
                     </Dialog>
                     <Dialog
                        open={openDialogOpen}
                        onClose={handleOpenDialogClose}
                        maxWidth="md"
                        fullWidth
                     >
                        <DialogTitle>Open Analysis</DialogTitle>
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
