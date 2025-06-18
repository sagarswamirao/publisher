import { Box, Divider, Grid, Typography } from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { useProject } from "./Project";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const packagesApi = new PackagesApi(new Configuration());

interface PackagesProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Packages({ navigate }: PackagesProps) {
   const { projectName } = useProject();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["packages", projectName],
      queryFn: (config) => packagesApi.listPackages(projectName, config),
   });

   return (
      <>
         {!isSuccess && !isError && <Loading text="Fetching Packages..." />}
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
