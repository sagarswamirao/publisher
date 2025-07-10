import React from "react";
import { Box, Stack, Typography, Tabs, Tab } from "@mui/material";
import { StyledCard, StyledCardContent } from "../styles";
import { ModelCell } from "./ModelCell";
import {
   QueryExplorerResult,
   SourceExplorerComponent,
} from "./SourcesExplorer";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useModelData } from "./useModelData";

export interface ModelExplorerProps {
   modelPath: string;
   versionId?: string;
   /** Display options forwarded to ModelCell */
   expandResults?: boolean;
   hideResultIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
   /** Callback when the explorer changes (e.g. when a query is selected). */
   onChange?: (query: QueryExplorerResult) => void;
}

/**
 * ModelExplorer renders the main explorer UI for a Malloy model. It shows the
 * selected source (via `SourceExplorerComponent`) along with the list of named
 * queries for that model. This logic was originally embedded inside `Model.tsx`
 * but has been extracted for easier reuse.
 */
export function ModelExplorer({
   modelPath,
   versionId,
   expandResults,
   hideResultIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
   onChange,
}: ModelExplorerProps) {
   const [selectedTab, setSelectedTab] = React.useState(0);

   const { data, isError, isLoading, error } = useModelData(
      modelPath,
      versionId,
   );

   if (isLoading) {
      return <Loading text="Fetching Model..." />;
   }

   if (isError) {
      console.log("error", error);
      return (
         <ApiErrorDisplay
            error={error}
            context={`ModelExplorer > ${modelPath}`}
         />
      );
   }

   return (
      <Stack spacing={2} component="section">
         {/* Render the tabs for source selection */}
         {Array.isArray(data.sourceInfos) && data.sourceInfos.length > 0 && (
            <Stack sx={{ flexDirection: "row", justifyContent: "flex-start" }}>
               <Tabs
                  value={selectedTab}
                  onChange={(_, newValue) => setSelectedTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                     borderBottom: 1,
                     borderColor: "divider",
                     minHeight: 36,
                  }}
               >
                  {data.sourceInfos.map((source, idx) => {
                     let sourceInfo;
                     try {
                        sourceInfo = JSON.parse(source);
                     } catch {
                        sourceInfo = { name: String(idx) };
                     }
                     return (
                        <Tab
                           key={sourceInfo.name || idx}
                           label={sourceInfo.name || `Source ${idx + 1}`}
                           sx={{ minHeight: 36 }}
                        />
                     );
                  })}
               </Tabs>
            </Stack>
         )}

         {/* Render the selected source info */}
         {Array.isArray(data.sourceInfos) && data.sourceInfos.length > 0 && (
            <SourceExplorerComponent
               sourceAndPath={{
                  modelPath,
                  sourceInfo: JSON.parse(data.sourceInfos[selectedTab]),
               }}
               onChange={onChange}
            />
         )}

         {/* Render the named queries */}
         {data.queries?.length > 0 && (
            <StyledCard
               variant="outlined"
               sx={{ padding: "0px 10px 0px 10px" }}
            >
               <StyledCardContent sx={{ p: "10px" }}>
                  <Typography variant="subtitle1">Named Queries</Typography>
               </StyledCardContent>

               <Stack spacing={1} component="section">
                  {data.queries.map((query) => (
                     <ModelCell
                        key={query.name}
                        modelPath={modelPath}
                        queryName={query.name}
                        expandResult={expandResults}
                        hideResultIcon={hideResultIcons}
                        expandEmbedding={expandEmbeddings}
                        hideEmbeddingIcon={hideEmbeddingIcons}
                        noView={true}
                        annotations={query.annotations}
                     />
                  ))}
               </Stack>
               <Box height="10px" />
            </StyledCard>
         )}
         <Box height="5px" />
      </Stack>
   );
}
