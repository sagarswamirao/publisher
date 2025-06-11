import { Grid } from "@mui/material";
import About from "./About";
import Packages from "./Packages";

interface ProjectProps {
   server?: string;
   projectName: string;
   navigate: (to: string, event?: React.MouseEvent) => void;
   accessToken?: string;
}

export default function Project({
   server,
   projectName,
   navigate,
   accessToken,
}: ProjectProps) {
   return (
      <Grid
         container
         spacing={2}
         columns={12}
         sx={{ mb: (theme) => theme.spacing(2) }}
      >
         <Grid size={{ xs: 12, md: 12 }}>
            <Packages
               server={server}
               projectName={projectName}
               navigate={navigate}
               accessToken={accessToken}
            />
         </Grid>
         <Grid size={{ xs: 12, md: 12 }}>
            <About
               server={server}
               projectName={projectName}
               accessToken={accessToken}
            />
         </Grid>
      </Grid>
   );
}
