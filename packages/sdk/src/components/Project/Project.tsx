import { Grid2 } from "@mui/material";
import About from "./About";
import Packages from "./Packages";

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
   return (
      <Grid2
         container
         spacing={2}
         columns={12}
         sx={{ mb: (theme) => theme.spacing(2) }}
      >
         <Grid2 size={{ xs: 12, md: 12 }}>
            <Packages
               server={server}
               navigate={navigate}
               accessToken={accessToken}
            />
         </Grid2>
         <Grid2 size={{ xs: 12, md: 12 }}>
            <About server={server} accessToken={accessToken} />
         </Grid2>
      </Grid2>
   );
}
