import { Grid } from "@mui/material";
import { Notebook } from "../Notebook";
import Config from "./Config";
import Connections from "./Connections";
import Databases from "./Databases";
import Models from "./Models";
import Notebooks from "./Notebooks";
import { PublisherPackageProvider } from "./PublisherPackageProvider";
import Schedules from "./Schedules";

const README_NOTEBOOK = "README.malloynb";

interface PackageProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   navigate?: (to: string, event?: React.MouseEvent) => void;
   accessToken?: string;
}

export default function Package({
   server,
   projectName,
   packageName,
   versionId,
   navigate,
   accessToken,
}: PackageProps) {
   if (!navigate) {
      navigate = (to: string) => {
         window.location.href = to;
      };
   }

   return (
      <PublisherPackageProvider
         server={server}
         accessToken={accessToken}
         projectName={projectName}
         packageName={packageName}
         versionId={versionId}
      >
         <Grid
            container
            spacing={2}
            columns={12}
            sx={{ mb: (theme) => theme.spacing(2) }}
         >
            <Grid size={{ xs: 12, md: 4 }}>
               <Config
                  server={server}
                  projectName={projectName}
                  packageName={packageName}
                  versionId={versionId}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Notebooks
                  server={server}
                  projectName={projectName}
                  packageName={packageName}
                  versionId={versionId}
                  navigate={navigate}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Models
                  server={server}
                  projectName={projectName}
                  packageName={packageName}
                  versionId={versionId}
                  navigate={navigate}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Databases
                  server={server}
                  projectName={projectName}
                  packageName={packageName}
                  versionId={versionId}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Connections
                  navigate={navigate}
                  server={server}
                  projectName={projectName}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <Schedules
                  server={server}
                  projectName={projectName}
                  packageName={packageName}
                  versionId={versionId}
                  accessToken={accessToken}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
               <Notebook
                  notebookPath={README_NOTEBOOK}
                  expandCodeCells={true}
                  hideEmbeddingIcons={true}
               />
            </Grid>
         </Grid>
      </PublisherPackageProvider>
   );
}
