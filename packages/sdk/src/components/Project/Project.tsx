import { Grid } from "@mui/material";
import { createContext, ReactNode, useContext } from "react";
import About from "./About";
import Packages from "./Packages";

export interface ProjectContextProps {
   projectName: string;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(
   undefined,
);

export function useProject(): ProjectContextProps {
   const context = useContext(ProjectContext);
   if (!context) {
      throw new Error("useProject must be used within a ProjectProvider");
   }
   return context;
}

interface ProjectProviderProps {
   children: ReactNode;
   projectName: string;
}

export function ProjectProvider({
   children,
   projectName,
}: ProjectProviderProps) {
   return (
      <ProjectContext.Provider value={{ projectName }}>
         {children}
      </ProjectContext.Provider>
   );
}

interface ProjectProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
}

export default function Project({ navigate }: ProjectProps) {
   return (
      <Grid container spacing={2} columns={12}>
         <Grid size={{ xs: 12, md: 12 }}>
            <Packages navigate={navigate} />
         </Grid>
         <Grid size={{ xs: 12, md: 12 }}>
            <About />
         </Grid>
      </Grid>
   );
}
