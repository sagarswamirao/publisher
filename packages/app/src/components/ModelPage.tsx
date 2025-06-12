import {
   Model,
   Notebook,
   PublisherPackageProvider,
} from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

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
            <Model modelPath={modelPath} hideEmbeddingIcons={true} />
         </PublisherPackageProvider>
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <PublisherPackageProvider
            projectName={params.projectName}
            packageName={params.packageName}
            server={server}
         >
            <Notebook
               notebookPath={modelPath}
               hideEmbeddingIcons={true}
               expandCodeCells={false}
            />
         </PublisherPackageProvider>
      );
   } else {
      return (
         <div>
            <h2>Unrecognized file type: {modelPath}</h2>
         </div>
      );
   }
}
