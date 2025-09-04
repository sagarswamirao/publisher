import { useParams } from "react-router-dom";
import { Package } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";

export function PackagePage() {
   const { projectName, packageName } = useParams();
   const navigate = useRouterClickHandler();
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
         <Package
            navigate={navigate}
            projectName={projectName}
            name={packageName}
         />
      );
   }
}
