import { Grid } from "@mui/material";
import About from "./About";
import Packages from "./Packages";
import { PackageContainer } from "../styles";

interface ProjectProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Project({ navigate }: ProjectProps) {
   return (
      <PackageContainer>
         <Grid container spacing={3} columns={12}>
            <Grid size={{ xs: 12, md: 12 }}>
               <Packages navigate={navigate} />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <About />
            </Grid>
         </Grid>
      </PackageContainer>
   );
}
