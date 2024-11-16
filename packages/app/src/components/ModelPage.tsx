import { useParams } from "react-router-dom";
import { Model, Notebook } from "@malloy-publisher/sdk";

interface ModelPageProps {
   server?: string;
}

export function ModelPage({ server }: ModelPageProps) {
   const params = useParams();
   const modelPath = params["*"];

   if (modelPath?.endsWith(".malloy")) {
      return (
         <Model
            server={server}
            packageName={params.packageName as string}
            modelPath={modelPath}
         />
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <Notebook
            server={server}
            packageName={params.packageName as string}
            notebookPath={modelPath}
         />
      );
   } else {
      return (
         <div>
            <h2>Unrecognized file type: {modelPath}</h2>
         </div>
      );
   }
}
