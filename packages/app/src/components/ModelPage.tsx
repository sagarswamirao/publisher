import { Model, Notebook } from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

export function ModelPage() {
   const params = useParams();
   console.log({ params });
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
         <Model
            projectName={params.projectName}
            packageName={params.packageName}
            modelPath={modelPath}
         />
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <Notebook
            notebookPath={modelPath}
            projectName={params.projectName}
            packageName={params.packageName}
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
