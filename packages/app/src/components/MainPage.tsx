import { Button, Stack } from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Outlet, useParams } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";
import { AnalyzePackageButton } from "@malloy-publisher/sdk";

interface PublisherConfigProps {
   showHeader?: boolean;
}

export default function MainPage({ showHeader = true }: PublisherConfigProps) {
   const { projectName, packageName } = useParams();

   return (
      <Container
         maxWidth="xl"
         component="main"
         sx={{ display: "flex", flexDirection: "column", my: 2, gap: 0 }}
      >
         {showHeader && (
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
                  {!projectName && !packageName && (
                     <>
                        <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                           Getting Started
                        </Button>
                        <Button href="/api-doc.html">API</Button>
                        <Button href="https://malloydata.dev/">Malloy</Button>
                     </>
                  )}
               </Stack>
            </Stack>
         )}
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
            {projectName && packageName && (
               <AnalyzePackageButton
                  projectName={projectName}
                  packageName={packageName}
               />
            )}
         </Stack>
         <Outlet />
      </Container>
   );
}
