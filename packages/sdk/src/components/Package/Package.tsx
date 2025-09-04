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
import { PublisherResourceProvider } from "./PublisherResourceProvider";
import { encodeResourceUri } from "../../utils/formatting";

const README_NOTEBOOK = "README.malloynb";

interface PackageProps {
   navigate?: (to: string, event?: React.MouseEvent) => void;
   projectName: string;
   name: string;
   versionId?: string;
}

export default function Package({
   navigate,
   projectName,
   name,
   versionId,
}: PackageProps) {
   if (!navigate) {
      navigate = (to: string) => {
         window.location.href = to;
      };
   }
   const resourceUri = encodeResourceUri({
      project: projectName,
      package: name,
      version: versionId,
   });

   return (
      <PublisherResourceProvider resourceUri={resourceUri}>
         <Grid container spacing={3} columns={12}>
            <Grid size={{ xs: 12, md: 4 }}>
               <Config />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Notebooks navigate={navigate} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Models
                  navigate={navigate}
                  projectName={projectName}
                  packageName={name}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Databases />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Connections />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <Schedules />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <PackageCard>
                  <PackageCardContent>
                     <PackageSectionTitle>README</PackageSectionTitle>
                     <Box sx={{ mt: 1 }}>
                        <Notebook
                           notebookPath={README_NOTEBOOK}
                           projectName={projectName}
                           packageName={name}
                        />
                     </Box>
                  </PackageCardContent>
               </PackageCard>
            </Grid>
         </Grid>
      </PublisherResourceProvider>
   );
}
