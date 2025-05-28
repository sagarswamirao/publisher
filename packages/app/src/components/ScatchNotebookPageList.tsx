import { useParams } from "react-router-dom";
import {
   BrowserNotebookStorage,
   MutableNotebookList,
   NotebookStorageProvider,
   PublisherPackageProvider,
} from "@malloy-publisher/sdk";
interface ScratchNotebookPageListProps {
   server?: string;
}

export function ScratchNotebookPageList({
   server,
}: ScratchNotebookPageListProps) {
   const { projectName, packageName } = useParams();
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
         <PublisherPackageProvider
            server={server}
            projectName={projectName}
            packageName={packageName}
         >
            <NotebookStorageProvider
               notebookStorage={new BrowserNotebookStorage()}
               userContext={{ project: projectName, package: packageName }}
            >
               <MutableNotebookList />
            </NotebookStorageProvider>
         </PublisherPackageProvider>
      );
   }
}
