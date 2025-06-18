import { Grid } from "@mui/material";
import { Notebook } from "../Notebook";
import Config from "./Config";
import Connections from "./Connections";
import Databases from "./Databases";
import Models from "./Models";
import Notebooks from "./Notebooks";
import Schedules from "./Schedules";

const README_NOTEBOOK = "README.malloynb";

interface PackageProps {
   navigate?: (to: string, event?: React.MouseEvent) => void;
}

export default function Package({ navigate }: PackageProps) {
   if (!navigate) {
      navigate = (to: string) => {
         window.location.href = to;
      };
   }

   return (
      <Grid
         container
         spacing={2}
         columns={12}
         sx={{ mb: (theme) => theme.spacing(2) }}
      >
         <Grid size={{ xs: 12, md: 4 }}>
            <Config />
         </Grid>
         <Grid size={{ xs: 12, md: 4 }}>
            <Notebooks navigate={navigate} />
         </Grid>
         <Grid size={{ xs: 12, md: 4 }}>
            <Models navigate={navigate} />
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
            <Notebook
               notebookPath={README_NOTEBOOK}
               hideEmbeddingIcons={true}
            />
         </Grid>
      </Grid>
   );
}
