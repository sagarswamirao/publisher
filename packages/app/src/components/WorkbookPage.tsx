import { PackageProvider, Workbook } from "@malloy-publisher/sdk";
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
            <Workbook
               key={`${workbookPath}-${projectName}-${packageName}`}
               workbookPath={workbookPath}
               hideEmbeddingIcons={true}
            />
         </PackageProvider>
      );
   }
}
