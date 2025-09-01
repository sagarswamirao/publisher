import { Model, PackageProvider, Notebook } from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

export function ModelPage() {
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
         >
            <Model modelPath={modelPath} />
         </PackageProvider>
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <PackageProvider
            projectName={params.projectName}
            packageName={params.packageName}
         >
            <Notebook notebookPath={modelPath} />
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
