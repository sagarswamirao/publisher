import { useParams } from "react-router-dom";
import { Project } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";

export function ProjectPage() {
   const navigate = useRouterClickHandler();
   const { projectName } = useParams();
   if (!projectName) {
      return (
         <div>
            <h2>Missing project name</h2>
         </div>
      );
   } else {
      return <Project navigate={navigate} name={projectName} />;
   }
}
