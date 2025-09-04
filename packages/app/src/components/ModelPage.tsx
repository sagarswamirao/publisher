import {
   Model,
   Notebook,
   PublisherResourceProvider,
} from "@malloy-publisher/sdk";
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
         <PublisherResourceProvider
            resourceUri={`publisher://${params.projectName}/${params.packageName}`}
         >
            <Model modelPath={modelPath} />
         </PublisherResourceProvider>
      );
   } else if (modelPath?.endsWith(".malloynb")) {
      return (
         <PublisherResourceProvider
            resourceUri={`publisher://${params.projectName}/${params.packageName}`}
         >
            <Notebook notebookPath={modelPath} />
         </PublisherResourceProvider>
      );
   } else {
      return (
         <div>
            <h2>Unrecognized file type: {modelPath}</h2>
         </div>
      );
   }
}
