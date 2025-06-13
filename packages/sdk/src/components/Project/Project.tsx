import { Grid } from "@mui/material";
import About from "./About";
import Packages from "./Packages";
import { createContext, useContext, ReactNode } from "react";

export interface ProjectContextProps {
   server?: string;
   projectName: string;
   accessToken?: string;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(
   undefined,
);

interface ProjectProviderProps extends ProjectContextProps {
   children: ReactNode;
}

export const ProjectProvider = ({
   server,
   projectName,
   accessToken,
   children,
}: ProjectProviderProps) => {
   return (
      <ProjectContext.Provider value={{ server, projectName, accessToken }}>
         {children}
      </ProjectContext.Provider>
   );
};

export function useProject() {
   const context = useContext(ProjectContext);
   if (!context) {
      throw new Error("useProject must be used within a ProjectProvider");
   }
   return context;
}

interface ProjectProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Project({ navigate }: ProjectProps) {
   return (
      <Grid
         container
         spacing={2}
         columns={12}
         sx={{ mb: (theme) => theme.spacing(2) }}
      >
         <Grid size={{ xs: 12, md: 12 }}>
            <Packages navigate={navigate} />
         </Grid>
         <Grid size={{ xs: 12, md: 12 }}>
            <About />
         </Grid>
      </Grid>
   );
}
