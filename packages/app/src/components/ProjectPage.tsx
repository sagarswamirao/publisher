import { useParams } from "react-router-dom";
import { Project, ProjectProvider } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";

interface ProjectPageProps {
   server?: string;
}

export function ProjectPage({ server }: ProjectPageProps) {
   const navigate = useRouterClickHandler();
   const { projectName } = useParams();
   if (!projectName) {
      return (
         <div>
            <h2>Missing project name</h2>
         </div>
      );
   } else {
      return (
         <ProjectProvider server={server} projectName={projectName}>
            <Project navigate={navigate} />
         </ProjectProvider>
      );
   }
}
