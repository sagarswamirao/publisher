import {
   PackageProvider,
   BrowserWorkbookStorage,
   WorkbookStorageProvider,
   Workbook,
} from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

export function WorkbookPage() {
   const { projectName, packageName, workbookPath } = useParams();
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
            <WorkbookStorageProvider
               workbookStorage={new BrowserWorkbookStorage()}
               userContext={{ project: projectName, package: packageName }}
            >
               <WorkbookStorageProvider
                  workbookStorage={new BrowserWorkbookStorage()}
                  userContext={{ project: projectName, package: packageName }}
               >
                  <Workbook
                     key={`${workbookPath}-${projectName}-${packageName}`}
                     workbookPath={workbookPath}
                     hideEmbeddingIcons={true}
                  />
               </WorkbookStorageProvider>
            </WorkbookStorageProvider>
         </PackageProvider>
      );
   }
}
