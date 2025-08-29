import { Box, Grid, Typography, Divider } from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { PackageCard, PackageCardContent } from "../styles";
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
            <Grid container spacing={3} columns={12}>
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
                           <PackageCard
                              sx={{
                                 cursor: "pointer",
                                 transition: "all 0.2s ease-in-out",
                                 "&:hover": {
                                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                                    transform: "translateY(-1px)",
                                 },
                              }}
                              onClick={(event) => navigate(p.name, event)}
                           >
                              <PackageCardContent>
                                 <Typography
                                    variant="overline"
                                    sx={{
                                       fontSize: "12px",
                                       fontWeight: "600",
                                       color: "primary.main",
                                       textTransform: "uppercase",
                                       letterSpacing: "0.5px",
                                       marginBottom: "8px",
                                       marginTop: "-16px",
                                    }}
                                 >
                                    {p.name}
                                 </Typography>
                                 <Divider sx={{ mb: 2 }} />
                                 <Box
                                    sx={{
                                       maxHeight: "120px",
                                       overflowY: "auto",
                                       mt: 2,
                                    }}
                                 >
                                    <Typography variant="body2">
                                       {p.description}
                                    </Typography>
                                 </Box>
                              </PackageCardContent>
                           </PackageCard>
                        </Grid>
                     );
                  })}
            </Grid>
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
