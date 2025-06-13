import {
   BrowserNotebookStorage,
   MutableNotebook,
   NotebookStorageProvider,
   PackageProvider,
} from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";
interface ScratchNotebookPageProps {
   server?: string;
}

export function ScratchNotebookPage({ server }: ScratchNotebookPageProps) {
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
         <PackageProvider
            server={server}
            projectName={projectName}
            packageName={packageName}
         >
            <NotebookStorageProvider
               notebookStorage={new BrowserNotebookStorage()}
               userContext={{ project: projectName, package: packageName }}
            >
               <MutableNotebook notebookPath={notebookPath} />
            </NotebookStorageProvider>
         </PackageProvider>
      );
   }
}
