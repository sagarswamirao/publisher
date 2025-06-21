import { Home, useRouterClickHandler } from "@malloy-publisher/sdk";
import { Security, Speed } from "@mui/icons-material";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function HomePage() {
   const navigate = useRouterClickHandler();

   return (
      <Box sx={{ minHeight: "100%" }}>
         {/* Hero Section */}
         <Card
            variant="outlined"
            sx={{
               background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
               color: "white",
               mb: 1,
               p: 1,
            }}
         >
            <Stack spacing={0.5} alignItems="center" textAlign="center">
               <Typography
                  variant="h5"
                  sx={{
                     fontWeight: 700,
                     letterSpacing: "-0.025em",
                     mb: 0.25,
                  }}
               >
                  Welcome to Malloy Publisher
               </Typography>
               <Typography
                  variant="body1"
                  sx={{
                     opacity: 0.9,
                     maxWidth: "600px",
                     lineHeight: 1.4,
                  }}
               >
                  Discover, analyze, and share your data with powerful Malloy
                  models
               </Typography>
            </Stack>
         </Card>

         {/* Features Grid */}
         <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ mb: 1 }}
         >
            <Card
               variant="outlined"
               sx={{
                  flex: 1,
                  p: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                     transform: "translateY(-2px)",
                  },
               }}
            >
               <Stack spacing={0.5}>
                  <Typography
                     variant="subtitle1"
                     fontWeight={600}
                     sx={{ mb: 0.25 }}
                  >
                     Data Discovery
                  </Typography>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ lineHeight: 1.4 }}
                  >
                     Explore your data with interactive Malloy models and
                     queries
                  </Typography>
               </Stack>
            </Card>

            <Card
               variant="outlined"
               sx={{
                  flex: 1,
                  p: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                     transform: "translateY(-2px)",
                  },
               }}
            >
               <Stack spacing={0.5}>
                  <Typography
                     variant="subtitle1"
                     fontWeight={600}
                     sx={{ mb: 0.25 }}
                  >
                     Analysis Tools
                  </Typography>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ lineHeight: 1.4 }}
                  >
                     Create and share interactive workbooks for data analysis
                  </Typography>
               </Stack>
            </Card>

            <Card
               variant="outlined"
               sx={{
                  flex: 1,
                  p: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                     transform: "translateY(-2px)",
                  },
               }}
            >
               <Stack spacing={0.5}>
                  <Typography
                     variant="subtitle1"
                     fontWeight={600}
                     sx={{ mb: 0.25 }}
                  >
                     Collaboration
                  </Typography>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ lineHeight: 1.4 }}
                  >
                     Share insights and collaborate with your team on data
                     projects
                  </Typography>
               </Stack>
            </Card>
         </Stack>

         {/* Additional Features */}
         <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Card sx={{ flex: 1, p: 1 }}>
               <CardContent sx={{ p: 0 }}>
                  <Stack spacing={0.5}>
                     <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                     >
                        <Speed sx={{ color: "warning.main", fontSize: 28 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                           High Performance
                        </Typography>
                     </Box>
                     <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.4 }}
                     >
                        Optimized query execution and intelligent caching ensure
                        fast performance even with large datasets and complex
                        analytical queries.
                     </Typography>
                  </Stack>
               </CardContent>
            </Card>

            <Card sx={{ flex: 1, p: 1 }}>
               <CardContent sx={{ p: 0 }}>
                  <Stack spacing={0.5}>
                     <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                     >
                        <Security sx={{ color: "info.main", fontSize: 28 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                           Enterprise Ready
                        </Typography>
                     </Box>
                     <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.4 }}
                     >
                        Built with enterprise security and scalability in mind.
                        Supports authentication, authorization, and
                        comprehensive audit logging.
                     </Typography>
                  </Stack>
               </CardContent>
            </Card>
         </Stack>

         {/* Fallback to original Home component for navigation */}
         <Box sx={{ display: "none" }}>
            <Home navigate={navigate} />
         </Box>
      </Box>
   );
}
