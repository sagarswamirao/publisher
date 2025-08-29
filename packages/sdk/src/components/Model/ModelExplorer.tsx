import React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { ModelCell } from "./ModelCell";
import {
   QueryExplorerResult,
   SourceExplorerComponent,
} from "./SourcesExplorer";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useModelData } from "./useModelData";

// Add a styled component for the multi-row tab bar
const MultiRowTabBar = styled(Box)(({ theme }) => ({
   display: "flex",
   flexWrap: "wrap",
   gap: theme.spacing(0.5),
   borderBottom: `1px solid ${theme.palette.divider}`,
   minHeight: 36,
}));

const MultiRowTab = styled(Button)<{ selected?: boolean }>(
   ({ theme, selected }) => ({
      minHeight: 36,
      padding: theme.spacing(0.5, 2),
      borderRadius: theme.shape.borderRadius,
      background: selected ? theme.palette.action.selected : "none",
      color: selected ? theme.palette.primary.main : theme.palette.text.primary,
      fontWeight: selected ? 600 : 400,
      border: selected
         ? `1px solid ${theme.palette.primary.main}`
         : `1px solid transparent`,
      boxShadow: selected ? theme.shadows[1] : "none",
      textTransform: "uppercase",
      "&:hover": {
         background: theme.palette.action.hover,
         border: `1px solid ${theme.palette.primary.light}`,
      },
   }),
);

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
      <StyledCard variant="outlined">
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
                                 onClick={() => setSelectedTab(idx)}
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
                     <SourceExplorerComponent
                        sourceAndPath={{
                           modelPath,
                           sourceInfo: JSON.parse(
                              data.sourceInfos[selectedTab],
                           ),
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
                        <Typography variant="subtitle1">
                           Named Queries
                        </Typography>
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
         </StyledCardMedia>
      </StyledCard>
   );
}
