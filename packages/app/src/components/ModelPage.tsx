import { useParams } from "react-router-dom";
import {
   Model,
   Notebook,
   PublisherPackageProvider,
} from "@malloy-publisher/sdk";

interface ModelPageProps {
   server?: string;
}

export function ModelPage({ server }: ModelPageProps) {
   const params = useParams();
   const modelPath = params["*"];

   if (!params.projectName) {
      return (
         <div>
            <h2>Missing project name</h2>
         </div>
      );
   } else if (!params.packageName) {
      return (
         <div>
            <h2>Missing package name</h2>
         </div>
      );
   } else if (modelPath?.endsWith(".malloy")) {
      return (
         <PublisherPackageProvider
            projectName={params.projectName}
            packageName={params.packageName}
            server={server}
         >
            <Model
               modelPath={modelPath}
               displayEmbeddingLink={true}
               showNamedQueries={true}
            />
         </PublisherPackageProvider>
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <Notebook
            server={server}
            projectName={params.projectName}
            packageName={params.packageName}
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
