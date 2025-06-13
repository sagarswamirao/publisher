import { Box, Divider, Grid, Typography } from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useProject } from "./Project";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

const packagesApi = new PackagesApi(new Configuration());
const queryClient = new QueryClient();

interface PackagesProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Packages({ navigate }: PackagesProps) {
   const { server, projectName, accessToken } = useProject();

   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["packages", server, projectName],
         queryFn: () =>
            packagesApi.listPackages(projectName, {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
         retry: false,
         throwOnError: false,
      },
      queryClient,
   );

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
                  <Grid
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
                           <Grid
                              size={{ xs: 12, sm: 12, md: 12, lg: 4 }}
                              key={p.name}
                           >
                              <StyledCard
                                 variant="outlined"
                                 sx={{ padding: "10px", cursor: "pointer" }}
                                 onClick={(event) =>
                                    navigate(p.name + "/", event)
                                 }
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
                           </Grid>
                        ))}
                  </Grid>
               </StyledCardMedia>
            </StyledCard>
         )}
         {isError && (
            <ApiErrorDisplay
               error={error}
               context={`${projectName} > Packages`}
            />
         )}
      </>
   );
}
