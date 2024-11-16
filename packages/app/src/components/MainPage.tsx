import { Box, Stack, Button } from "@mui/material";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import BreadcrumbNav from "./BreadcrumbNav";
import { Outlet } from "react-router-dom";

export default function MainPage() {
   return (
      <Container
         maxWidth="lg"
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
               <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                  Getting Started
               </Button>
               <Button href="/api-doc.html">API</Button>
               <Button href="https://malloydata.dev/">Malloy</Button>
            </Stack>
         </Stack>
         <Box
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
         </Box>
         <Outlet />
      </Container>
   );
}
