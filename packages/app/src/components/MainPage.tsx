import { AnalyzePackageButton } from "@malloy-publisher/sdk";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import Container from "@mui/material/Container";
import { Outlet, useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

interface PublisherConfigProps {
   showHeader?: boolean;
}

export default function MainPage({ showHeader = true }: PublisherConfigProps) {
   const { projectName, packageName } = useParams();

   return (
      <Box
         sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
         {showHeader && (
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
                     <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                     >
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
                           <Button
                              href="https://docs.malloydata.dev/documentation/"
                              size="small"
                           >
                              Malloy Docs
                           </Button>
                           <Button
                              href="https://github.com/malloydata/publisher/blob/main/README.md"
                              size="small"
                           >
                              Publisher Docs
                           </Button>
                           <Button href="/api-doc.html" size="small">
                              Publisher API
                           </Button>
                        </>
                     ) : (
                        <>
                           <AnalyzePackageButton
                              projectName={projectName}
                              packageName={packageName}
                           />
                        </>
                     )}
                  </Stack>
               </Toolbar>
            </AppBar>
         )}

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
      </Box>
   );
}
