import { Grid } from "@mui/material";
import About from "./About";
import Packages from "./Packages";
import { PackageContainer } from "../styles";
import { PublisherResourceProvider } from "../Package";
import { encodeResourceUri } from "../../utils/formatting";

interface ProjectProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
   name: string;
}

export default function Project({ navigate, name }: ProjectProps) {
   const resourceUri = encodeResourceUri({ project: name });
   return (
      <PublisherResourceProvider resourceUri={resourceUri}>
         <PackageContainer>
            <Grid container spacing={3} columns={12}>
               <Grid size={{ xs: 12, md: 12 }}>
                  <Packages navigate={navigate} projectName={name} />
               </Grid>
               <Grid size={{ xs: 12, md: 12 }}>
                  <About />
               </Grid>
            </Grid>
         </PackageContainer>
      </PublisherResourceProvider>
   );
}
