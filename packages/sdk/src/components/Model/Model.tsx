import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@malloydata/malloy-explorer/styles.css";
import { QueryExplorerResult } from "./SourcesExplorer";
import { Loading } from "../Loading";
import { ModelExplorer } from "./ModelExplorer";
import { ModelExplorerDialog } from "./ModelExplorerDialog";
import { ModelCell } from "./ModelCell";
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
   const { data, isError, isLoading, error } = useModelData(modelPath, versionId);
   const [dialogOpen, setDialogOpen] = React.useState(false);
   const [sharedQuery, setSharedQuery] = React.useState<
      QueryExplorerResult | undefined
   >();
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
      <Box
         sx={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
            paddingTop: "24px",
         }}
      >
         {/* Sources Section */}
         {Array.isArray(data?.sourceInfos) && data.sourceInfos.length > 0 && (
            <Stack spacing={2} component="section">
               {/* Sources Header */}
               <Box sx={{ padding: "0 0 16px 0" }}>
                  <Typography
                     variant="h1"
                     sx={{
                        fontSize: "28px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "8px",
                        marginTop: "0",
                        paddingLeft: "0",
                     }}
                  >
                     Sources
                  </Typography>
               </Box>

               <ModelExplorer
                  modelPath={modelPath}
                  data={data}
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
            </Stack>
         )}

         {/* Named Queries Section */}
         {data?.queries?.length > 0 && (
            <Stack spacing={2} component="section" sx={{ marginTop: "24px" }}>
               {/* Named Queries Header */}
               <Box sx={{ padding: "0 0 16px 0" }}>
                  <Typography
                     variant="h2"
                     sx={{
                        fontSize: "24px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "0",
                        marginTop: "8px",
                        paddingLeft: "0",
                     }}
                  >
                     Named Queries
                  </Typography>
               </Box>

               {/* Render the named queries */}
               {data.queries.map((query) => (
                  <ModelCell
                     key={query.name}
                     modelPath={modelPath}
                     queryName={query.name}
                     annotations={query.annotations}
                  />
               ))}
            </Stack>
         )}

         {/* Model Explorer Dialog */}
         <ModelExplorerDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            modelPath={modelPath}
            data={data}
            title={`Model: ${modelPath.split("/").pop()}`}
            existingQuery={sharedQuery}
            initialSelectedSourceIndex={sharedSourceIndex}
            onChange={handleQueryChange}
            onSourceChange={handleSourceChange}
         />
      </Box>
   );
}
