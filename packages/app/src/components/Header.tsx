
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BreadcrumbNav from "./BreadcrumbNav";

export interface HeaderProps {
   logoHeader?: React.ReactElement;
   endCap?: React.ReactElement;
}

export default function Header({ logoHeader, endCap }: HeaderProps) {
   const navigate = useNavigate();

   return (
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
               {logoHeader ? (
                  logoHeader
               ) : (
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
                           cursor: "pointer",
                        }}
                        onClick={() => {
                           navigate("/");
                        }}
                     >
                        Malloy Publisher
                     </Typography>
                  </Box>
               )}
               <BreadcrumbNav />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
               {!logoHeader && (
                     <>
                        <Button href="https://docs.malloydata.dev/documentation/">
                           Malloy Docs
                        </Button>
                        <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                           Publisher Docs
                        </Button>
                        <Button href="/api-doc.html">Publisher API</Button>
                     </>
                  )
               }
               {endCap}
            </Stack>
         </Toolbar>
      </AppBar>
   );
}
