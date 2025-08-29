import { ApiErrorDisplay } from "../ApiErrorDisplay";

import "@malloydata/malloy-explorer/styles.css";
import { QueryExplorerResult } from "./SourcesExplorer";
import { Loading } from "../Loading";
import { ModelExplorer } from "./ModelExplorer";
import { useModelData } from "./useModelData";

interface ModelProps {
   modelPath: string;
   versionId?: string;
   onChange?: (query: QueryExplorerResult) => void;
}

// Note: For this to properly render outside of publisher,
// you must explicitly import the styles from the package:
// import "@malloy-publisher/sdk/malloy-explorer.css";

export default function Model({ modelPath, versionId, onChange }: ModelProps) {
   const { isError, isLoading, error } = useModelData(modelPath, versionId);

   if (isLoading) {
      return <Loading text="Fetching Model..." />;
   }

   if (isError) {
      console.log("error", error);
      return <ApiErrorDisplay error={error} context={`Model > ${modelPath}`} />;
   }
   return (
      <ModelExplorer
         modelPath={modelPath}
         versionId={versionId}
         onChange={onChange}
      />
   );
}
