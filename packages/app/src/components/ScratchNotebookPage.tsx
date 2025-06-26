import {
   BrowserNotebookStorage,
   MutableNotebook,
   NotebookStorageProvider,
   PackageProvider,
} from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

export function ScratchNotebookPage() {
   const { projectName, packageName, notebookPath } = useParams();
   if (!projectName) {
      return (
         <div>
            <h2>Missing project name</h2>
         </div>
      );
   } else if (!packageName) {
      return (
         <div>
            <h2>Missing package name</h2>
         </div>
      );
   } else {
      return (
         <PackageProvider projectName={projectName} packageName={packageName}>
            <NotebookStorageProvider
               notebookStorage={new BrowserNotebookStorage()}
               userContext={{ project: projectName, package: packageName }}
            >
               <MutableNotebook
                  key={`${notebookPath}-${projectName}-${packageName}`}
                  notebookPath={notebookPath}
                  hideEmbeddingIcons={true}
               />
            </NotebookStorageProvider>
         </PackageProvider>
      );
   }
}
