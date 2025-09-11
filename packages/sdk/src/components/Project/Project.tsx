import { Box, Grid, Typography } from "@mui/material";
import About from "./About";
import Packages from "./Packages";
import { PackageContainer } from "../styles";
import { parseResourceUri } from "../../utils/formatting";
import AddPackageDialog from "./AddPackageDialog";

interface ProjectProps {
   onSelectPackage: (to: string, event?: React.MouseEvent) => void;
   resourceUri: string;
}

export default function Project({
   onSelectPackage,
   resourceUri,
}: ProjectProps) {
   const { projectName } = parseResourceUri(resourceUri);
   return (
      <>
         <PackageContainer>
            <Box
               display="flex"
               justifyContent="space-between"
               alignItems="center"
               mb={2}
            >
               <Typography variant="h6">{projectName} packages</Typography>
               <AddPackageDialog resourceUri={resourceUri} />
            </Box>
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
