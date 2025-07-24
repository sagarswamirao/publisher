import { Box, Grid, Typography } from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { StyledCard, StyledCardContent } from "../styles";
import { useProject } from "./Project";

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
            <StyledCard variant="outlined" sx={{ p: 2 }}>
               <Typography variant="overline" fontWeight="bold" sx={{ mb: 1 }}>
                  Packages
               </Typography>
               <Grid container spacing={2} columns={12}>
                  {data.data
                     .sort((a, b) => {
                        return a.name.localeCompare(b.name);
                     })
                     .map((p) => {
                        return (
                           <Grid
                              size={{ xs: 12, sm: 12, md: 12, lg: 4 }}
                              key={p.name}
                           >
                              <StyledCard
                                 variant="outlined"
                                 sx={{
                                    cursor: "pointer",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                       boxShadow:
                                          "0 4px 12px rgba(0, 0, 0, 0.1)",
                                       transform: "translateY(-2px)",
                                    },
                                 }}
                                 onClick={(event) => navigate(p.name, event)}
                              >
                                 <StyledCardContent>
                                    <Typography
                                       variant="overline"
                                       color="primary.main"
                                    >
                                       {p.name}
                                    </Typography>
                                    <Box
                                       sx={{
                                          maxHeight: "120px",
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
                        );
                     })}
               </Grid>
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
