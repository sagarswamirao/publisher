import { encodeResourceUri, Model, Notebook } from "@malloy-publisher/sdk";
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
      const resourceUri = encodeResourceUri({
         project: params.projectName,
         package: params.packageName,
      });
      return <Model resourceUri={resourceUri} modelPath={modelPath} />;
   } else if (modelPath?.endsWith(".malloynb")) {
      const resourceUri = encodeResourceUri({
         project: params.projectName,
         package: params.packageName,
      });
      return <Notebook notebookPath={modelPath} resourceUri={resourceUri} />;
   } else {
      return (
         <div>
            <h2>Unrecognized file type: {modelPath}</h2>
         </div>
      );
   }
}
