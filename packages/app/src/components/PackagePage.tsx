import { useParams, useNavigate } from "react-router-dom";
import { Package } from "@malloy-publisher/sdk";

interface PackagePageProps {
   server?: string;
}

export function PackagePage({ server }: PackagePageProps) {
   const { packageName } = useParams();
   const navigate = useNavigate();
   return (
      <Package
         server={server}
         packageName={packageName as string}
         navigate={navigate}
      />
   );
}
