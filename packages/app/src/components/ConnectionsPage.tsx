import { ConnectionExplorer } from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

interface ConnectionsPageProps {
   server?: string;
}

export function ConnectionsPage({ server }: ConnectionsPageProps) {
   const { projectName, connectionName } = useParams();
   if (!projectName || !connectionName) {
      return (
         <div>
            <h2>Missing project name or connection name</h2>
         </div>
      );
   }

   return (
      <ConnectionExplorer
         server={server}
         projectName={projectName}
         connectionName={connectionName}
      />
   );
}
