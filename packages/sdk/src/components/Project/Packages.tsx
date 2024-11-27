import { Box, Divider, Grid2, Typography } from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import axios from "axios";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { QueryClient, useQuery } from "@tanstack/react-query";

axios.defaults.baseURL = "http://localhost:4000";
const packagesApi = new PackagesApi(new Configuration());
const queryClient = new QueryClient();

interface ProjectProps {
   server?: string;
   navigate?: (to: string) => void;
   accessToken?: string;
}

export default function Project({
   server,
   navigate,
   accessToken,
}: ProjectProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["packages", server],
         queryFn: () =>
            packagesApi.listPackages({
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
      },
      queryClient,
   );

   if (!navigate) {
      navigate = (to: string) => {
         window.location.href = to;
      };
   }

   return (
      <>
         {!isSuccess && !isError && (
            <Typography variant="body2" sx={{ p: "20px", m: "auto" }}>
               Fetching Packages...
            </Typography>
         )}
         {isSuccess && (
            <StyledCard variant="outlined">
               <StyledCardContent>
                  <Typography variant="overline" fontWeight="bold">
                     Packages
                  </Typography>
                  <Divider />
               </StyledCardContent>
               <StyledCardMedia>
                  <Grid2
                     container
                     spacing={2}
                     columns={12}
                     sx={{ mb: (theme) => theme.spacing(2) }}
                  >
                     {data.data
                        .sort((a, b) => {
                           return a.name.localeCompare(b.name);
                        })
                        .map((p) => (
                           <Grid2
                              size={{ xs: 12, sm: 12, md: 12, lg: 4 }}
                              key={p.name}
                           >
                              <StyledCard
                                 variant="outlined"
                                 sx={{ padding: "10px", cursor: "pointer" }}
                                 onClick={() => navigate(p.name + "/")}
                              >
                                 <StyledCardContent>
                                    <Typography
                                       variant="overline"
                                       color="primary.main"
                                    >
                                       {p.name}
                                    </Typography>
                                    <Divider />
                                    <Box
                                       sx={{
                                          mt: "10px",
                                          maxHeight: "100px",
                                          overflowY: "auto",
                                       }}
                                    >
                                       <Typography variant="body2">
                                          {p.description}
                                       </Typography>
                                    </Box>
                                 </StyledCardContent>
                              </StyledCard>
                           </Grid2>
                        ))}
                  </Grid2>
               </StyledCardMedia>
            </StyledCard>
         )}
         {isError && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               {error.message}
            </Typography>
         )}
      </>
   );
}
