import { useParams } from "react-router-dom";
import { Model, Notebook } from "@malloy-publisher/sdk";

interface ModelPageProps {
   server?: string;
}

export function ModelPage({ server }: ModelPageProps) {
   const params = useParams();
   const modelPath = params["*"];

   if (!params.packageName) {
      return (<div><h2>Missing package name</h2></div>);
   } else if (modelPath?.endsWith(".malloy")) {
      return (
         <Model
            server={server}
            packageName={params.packageName}
            modelPath={modelPath}
         />
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <Notebook
            server={server}
            packageName={params.packageName}
            notebookPath={modelPath}
         />
      );
   } else {
      return (<div><h2>Unrecognized file type: {modelPath}</h2></div>);
   }
}
