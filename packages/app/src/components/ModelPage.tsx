import { Model, Notebook, PackageProvider } from "@malloy-publisher/sdk";
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
         <PackageProvider
            projectName={params.projectName}
            packageName={params.packageName}
            server={server}
         >
            <Model modelPath={modelPath} hideEmbeddingIcons={true} />
         </PackageProvider>
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <PackageProvider
            projectName={params.projectName}
            packageName={params.packageName}
            server={server}
         >
            <Notebook
               notebookPath={modelPath}
               hideEmbeddingIcons={true}
               expandCodeCells={false}
            />
         </PackageProvider>
      );
   } else {
      return (
         <div>
            <h2>Unrecognized file type: {modelPath}</h2>
         </div>
      );
   }
}
