import React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { ModelCell } from "./ModelCell";
import { QueryExplorerResult, SourcesExplorer } from "./SourcesExplorer";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useModelData } from "./useModelData";

// Add a styled component for the multi-row tab bar
const MultiRowTabBar = styled(Box)(({ theme }) => ({
   display: "flex",
   flexWrap: "wrap",
   gap: theme.spacing(1),
   borderBottom: "1px solid #f0f0f0",
   minHeight: 48,
   paddingBottom: "8px",
}));

const MultiRowTab = styled(Button)<{ selected?: boolean }>(
   ({ theme, selected }) => ({
      minHeight: 32,
      padding: theme.spacing(0.75, 2),
      borderRadius: "6px",
      background: selected ? "#f8f9fa" : "transparent",
      color: selected ? "#495057" : "#666666",
      fontWeight: selected ? 600 : 500,
      border: selected ? "1px solid #e9ecef" : "1px solid transparent",
      boxShadow: "none",
      textTransform: "none",
      fontSize: "15px",
      "&:hover": {
         background: selected ? "#f8f9fa" : "#fafafa",
         border: selected ? "1px solid #e9ecef" : "1px solid #f0f0f0",
      },
   }),
);

export interface ModelExplorerProps {
   modelPath: string;
   versionId?: string;
   /** Callback when the explorer changes (e.g. when a query is selected). */
   onChange?: (query: QueryExplorerResult) => void;
   /** Existing query to initialize the explorer with */
   existingQuery?: QueryExplorerResult;
   /** Initial selected source index */
   initialSelectedSourceIndex?: number;
   /** Callback when source selection changes */
   onSourceChange?: (index: number) => void;
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
   onChange,
   existingQuery,
   initialSelectedSourceIndex = 0,
   onSourceChange,
}: ModelExplorerProps) {
   const [selectedTab, setSelectedTab] = React.useState(
      initialSelectedSourceIndex,
   );

   // Update selectedTab when initialSelectedSourceIndex changes
   React.useEffect(() => {
      setSelectedTab(initialSelectedSourceIndex);
   }, [initialSelectedSourceIndex]);

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
      <StyledCard variant="outlined">
         {/* Sources Header */}
         {Array.isArray(data.sourceInfos) && data.sourceInfos.length > 0 && (
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
         )}

         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
               }}
            >
               {/* Render the tabs for source selection */}
               {Array.isArray(data.sourceInfos) &&
                  data.sourceInfos.length > 0 && (
                     <MultiRowTabBar>
                        {data.sourceInfos.map((source, idx) => {
                           let sourceInfo;
                           try {
                              sourceInfo = JSON.parse(source);
                           } catch {
                              sourceInfo = { name: String(idx) };
                           }
                           return (
                              <MultiRowTab
                                 key={sourceInfo.name || idx}
                                 selected={selectedTab === idx}
                                 onClick={() => {
                                    setSelectedTab(idx);
                                    if (onSourceChange) {
                                       onSourceChange(idx);
                                    }
                                 }}
                              >
                                 {sourceInfo.name || `Source ${idx + 1}`}
                              </MultiRowTab>
                           );
                        })}
                     </MultiRowTabBar>
                  )}
            </Stack>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack spacing={2} component="section">
               {/* Render the selected source info */}
               {Array.isArray(data.sourceInfos) &&
                  data.sourceInfos.length > 0 && (
                     <SourcesExplorer
                        sourceAndPaths={data.sourceInfos.map((source) => {
                           const sourceInfo = JSON.parse(source);
                           return {
                              sourceInfo: sourceInfo,
                              modelPath: modelPath,
                           };
                        })}
                        selectedSourceIndex={selectedTab}
                        existingQuery={existingQuery}
                        onQueryChange={onChange}
                     />
                  )}

               {/* Named Queries Header */}
               {data.queries?.length > 0 && (
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
               )}

               {/* Render the named queries */}
               {data.queries?.length > 0 && (
                  <Stack spacing={2} component="section">
                     {data.queries.map((query) => (
                        <ModelCell
                           key={query.name}
                           modelPath={modelPath}
                           queryName={query.name}
                           noView={true}
                           annotations={query.annotations}
                        />
                     ))}
                  </Stack>
               )}
               <Box height="5px" />
            </Stack>
         </StyledCardMedia>
      </StyledCard>
   );
}
