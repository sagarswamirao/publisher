import { Button, Menu, MenuItem, Stack } from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import React from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export default function MainPage() {
   const { projectName, packageName } = useParams();
   const navigate = useNavigate();

   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
   const open = Boolean(anchorEl);
   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
   };
   const handleClose = () => {
      setAnchorEl(null);
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
            }}
         >
            <div>
               <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "text.primary" }}
               >
                  Malloy Publisher
               </Typography>
            </div>
            <Stack
               sx={{
                  display: "flex",
                  flexDirection: "row",
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
                     >
                        Analyze
                     </Button>
                     <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                           list: {
                              "aria-labelledby": "basic-button",
                           },
                        }}
                     >
                        <MenuItem
                           onClick={() => {
                              navigate(
                                 `/${projectName}/${packageName}/listScratchNotebooks`,
                              );
                              handleClose();
                           }}
                        >
                           List Analyses
                        </MenuItem>
                        <MenuItem
                           onClick={() => {
                              navigate(
                                 `/${projectName}/${packageName}/scratchNotebook#notebookPath=`,
                              );
                              handleClose();
                           }}
                        >
                           Create New Analysis
                        </MenuItem>
                     </Menu>
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
