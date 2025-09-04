import { Grid, Box } from "@mui/material";
import { Notebook } from "../Notebook";
import Config from "./Config";
import Connections from "./Connections";
import Databases from "./Databases";
import Models from "./Models";
import Notebooks from "./Notebooks";
import Schedules from "./Schedules";
import {
   PackageCard,
   PackageCardContent,
   PackageSectionTitle,
} from "../styles";

const README_NOTEBOOK = "README.malloynb";

interface PackageProps {
   navigate?: (to: string, event?: React.MouseEvent) => void;
   resourceUri: string;
}

export default function Package({ navigate, resourceUri }: PackageProps) {
   if (!navigate) {
      navigate = (to: string) => {
         window.location.href = to;
      };
   }

   return (
      <>
         <Grid container spacing={3} columns={12}>
            <Grid size={{ xs: 12, md: 4 }}>
               <Config resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Notebooks navigate={navigate} resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Models navigate={navigate} resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Databases resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Connections resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <Schedules resourceUri={resourceUri} />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <PackageCard>
                  <PackageCardContent>
                     <PackageSectionTitle>README</PackageSectionTitle>
                     <Box sx={{ mt: 1 }}>
                        <Notebook
                           notebookPath={README_NOTEBOOK}
                           resourceUri={resourceUri}
                        />
                     </Box>
                  </PackageCardContent>
               </PackageCard>
            </Grid>
         </Grid>
      </>
   );
}
