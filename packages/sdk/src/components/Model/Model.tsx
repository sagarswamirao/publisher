import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Box, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@malloydata/malloy-explorer/styles.css";
import { QueryExplorerResult } from "./SourcesExplorer";
import { Loading } from "../Loading";
import { ModelExplorer } from "./ModelExplorer";
import { ModelExplorerDialog } from "./ModelExplorerDialog";
import { useModelData } from "./useModelData";
import React from "react";

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
   const [dialogOpen, setDialogOpen] = React.useState(false);
   const [sharedQuery, setSharedQuery] = React.useState<QueryExplorerResult | undefined>();
   const [sharedSourceIndex, setSharedSourceIndex] = React.useState(0);

   if (isLoading) {
      return <Loading text="Fetching Model..." />;
   }

   if (isError) {
      console.log("error", error);
      return <ApiErrorDisplay error={error} context={`Model > ${modelPath}`} />;
   }

   // Shared handlers for both embedded and dialog explorers
   const handleQueryChange = (query: QueryExplorerResult) => {
      setSharedQuery(query);
      if (onChange) {
         onChange(query);
      }
   };

   const handleSourceChange = (index: number) => {
      setSharedSourceIndex(index);
   };
   
   return (
      <Box sx={{ position: "relative", maxWidth: "1200px", margin: "0 auto", paddingTop: "24px" }}>
         <ModelExplorer
            modelPath={modelPath}
            versionId={versionId}
            onChange={handleQueryChange}
            onSourceChange={handleSourceChange}
            existingQuery={sharedQuery}
            initialSelectedSourceIndex={sharedSourceIndex}
         />
         
         {/* Magnifying glass icon */}
         <IconButton
            sx={{
               position: "absolute",
               top: "90px",
               right: "4px",
               backgroundColor: "rgba(255, 255, 255, 0.9)",
               "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 1)",
               },
               width: "32px",
               height: "32px",
               zIndex: 2,
            }}
            onClick={() => setDialogOpen(true)}
         >
            <SearchIcon sx={{ fontSize: "18px", color: "#666666" }} />
         </IconButton>
         
         {/* Model Explorer Dialog */}
         <ModelExplorerDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            modelPath={modelPath}
            title={`Model: ${modelPath.split('/').pop()}`}
            existingQuery={sharedQuery}
            initialSelectedSourceIndex={sharedSourceIndex}
            onChange={handleQueryChange}
            onSourceChange={handleSourceChange}
         />
      </Box>
   );
}
