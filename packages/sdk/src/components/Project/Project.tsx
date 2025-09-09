import { Grid } from "@mui/material";
import About from "./About";
import Packages from "./Packages";
import { PackageContainer } from "../styles";

interface ProjectProps {
   onSelectPackage: (to: string, event?: React.MouseEvent) => void;
   resourceUri: string;
}

export default function Project({
   onSelectPackage,
   resourceUri,
}: ProjectProps) {
   return (
      <>
         <PackageContainer>
            <Grid container spacing={3} columns={12}>
               <Grid size={{ xs: 12, md: 12 }}>
                  <Packages
                     onSelectPackage={onSelectPackage}
                     resourceUri={resourceUri}
                  />
               </Grid>
               <Grid size={{ xs: 12, md: 12 }}>
                  <About resourceUri={resourceUri} />
               </Grid>
            </Grid>
         </PackageContainer>
      </>
   );
}
