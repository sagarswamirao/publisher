import { PackageProvider, Workbook } from "@malloy-publisher/sdk";
import { useParams } from "react-router-dom";

export function WorkbookPage() {
   const { projectName, packageName, workspace, workbookPath } = useParams();
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
   } else if (!workspace) {
      return (
         <div>
            <h2>Missing workspace</h2>
         </div>
      );
   } else if (!workbookPath) {
      return (
         <div>
            <h2>Missing workbook path</h2>
         </div>
      );
   } else {
      return (
         <PackageProvider projectName={projectName} packageName={packageName}>
            <Workbook
               key={`${workbookPath}-${projectName}-${packageName}`}
               workbookPath={{ path: workbookPath, workspace: workspace }}
               hideEmbeddingIcons={true}
            />
         </PackageProvider>
      );
   }
}
