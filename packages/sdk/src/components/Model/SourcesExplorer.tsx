import * as Malloy from "@malloydata/malloy-interfaces";
import * as QueryBuilder from "@malloydata/malloy-query-builder";
import { Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import {
   StyledCard,
   StyledCardContent,
   StyledCardMedia,
   StyledExplorerContent,
   StyledExplorerPage,
} from "../styles";

import {
   MalloyExplorerProvider,
   QueryPanel,
   ResizableCollapsiblePanel,
   ResultPanel,
   SourcePanel,
} from "@malloydata/malloy-explorer";
import { styled } from "@mui/material/styles";
import React from "react";
import { Configuration, QueryresultsApi } from "../../client";
import { usePackage } from "../Package/PackageProvider";
import { useMutationWithApiError } from "../../hooks/useQueryWithApiError";

const queryResultsApi = new QueryresultsApi(new Configuration());

export interface SourceAndPath {
   modelPath: string;
   sourceInfo: Malloy.SourceInfo;
}

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

export interface SourceExplorerProps {
   sourceAndPaths: SourceAndPath[];
   existingQuery?: QueryExplorerResult;
   existingSourceName?: string;
   onChange?: (query: QueryExplorerResult) => void;
}

/**
 * Component for Exploring a set of sources.
 * Sources are provided as a list of SourceAndPath objects where each entry
 * Maps from a model path to a source info object.
 * It is expected that multiple sourceInfo entries will correspond to the same
 * model path.
 */
export function SourcesExplorer({
   sourceAndPaths,
   existingQuery,
   existingSourceName,
   onChange,
}: SourceExplorerProps) {
   const [selectedTab, setSelectedTab] = React.useState(
      existingSourceName
         ? sourceAndPaths.findIndex(
              (entry) => entry.sourceInfo.name === existingSourceName,
           )
         : 0,
   );

   const [query, setQuery] = React.useState<QueryExplorerResult | undefined>(
      existingQuery || emptyQueryExplorerResult(),
   );

   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
               }}
            >
               {sourceAndPaths.length > 0 && (
                  <MultiRowTabBar>
                     {sourceAndPaths.map((sourceAndPath, idx) => (
                        <MultiRowTab
                           key={sourceAndPath.sourceInfo.name || idx}
                           selected={selectedTab === idx}
                           onClick={() => setSelectedTab(idx)}
                        >
                           {sourceAndPath.sourceInfo.name ||
                              `Source ${idx + 1}`}
                        </MultiRowTab>
                     ))}
                  </MultiRowTabBar>
               )}
            </Stack>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack spacing={2} component="section">
               <SourceExplorerComponent
                  sourceAndPath={sourceAndPaths[selectedTab]}
                  existingQuery={query}
                  onChange={(query) => {
                     setQuery(query);
                     if (onChange) {
                        onChange(query);
                     }
                  }}
               />
               <Box height="5px" />
            </Stack>
         </StyledCardMedia>
      </StyledCard>
   );
}

interface SourceExplorerComponentProps {
   sourceAndPath: SourceAndPath;
   existingQuery?: QueryExplorerResult;
   onChange?: (query: QueryExplorerResult) => void;
}

export interface QueryExplorerResult {
   query: string | undefined;
   malloyQuery: Malloy.Query | undefined;
   malloyResult: Malloy.Result | undefined;
}

export function emptyQueryExplorerResult(): QueryExplorerResult {
   return {
      query: undefined,
      malloyQuery: undefined,
      malloyResult: undefined,
   };
}
export function SourceExplorerComponent({
   sourceAndPath,
   onChange,
   existingQuery,
}: SourceExplorerComponentProps) {
   const [query, setQuery] = React.useState<QueryExplorerResult>(
      existingQuery || emptyQueryExplorerResult(),
   );
   const [focusedNestViewPath, setFocusedNestViewPath] = React.useState<
      string[]
   >([]);

   React.useEffect(() => {
      if (onChange) {
         onChange(query);
      }
   }, [onChange, query]);
   const { projectName, packageName, versionId } = usePackage();
   const mutation = useMutationWithApiError({
      mutationFn: (_, config) => {
         const malloy = new QueryBuilder.ASTQuery({
            source: sourceAndPath.sourceInfo,
            query: query?.malloyQuery,
         }).toMalloy();
         setQuery({
            ...query,
            query: malloy,
         });
         return queryResultsApi.executeQuery(
            projectName,
            packageName,
            sourceAndPath.modelPath,
            malloy,
            undefined,
            // sourceInfo.name,
            undefined,
            versionId,
            config,
         );
      },
      onSuccess: (data) => {
         if (data) {
            const parsedResult = JSON.parse(data.data.result);
            setQuery({
               ...query,
               malloyResult: parsedResult as Malloy.Result,
            });
         }
      },
   });

   const [oldSourceInfo, setOldSourceInfo] = React.useState(
      sourceAndPath.sourceInfo.name,
   );

   // This hack is needed since sourceInfo is updated before
   // query is reset, which results in the query not being found
   // because it does not exist on the new source.
   React.useEffect(() => {
      if (oldSourceInfo !== sourceAndPath.sourceInfo.name) {
         setOldSourceInfo(sourceAndPath.sourceInfo.name);
         setQuery(emptyQueryExplorerResult());
      }
   }, [sourceAndPath, oldSourceInfo]);

   const onQueryChange = React.useCallback(
      (malloyQuery: Malloy.Query) => {
         setQuery({ ...query, malloyQuery });
      },
      [query],
   );

   if (oldSourceInfo !== sourceAndPath.sourceInfo.name) {
      return <div>Loading...</div>;
   }

   return (
      <StyledExplorerPage key={sourceAndPath.sourceInfo.name}>
         <StyledExplorerContent>
            <MalloyExplorerProvider
               source={sourceAndPath.sourceInfo}
               query={query?.malloyQuery}
               onQueryChange={onQueryChange}
               focusedNestViewPath={focusedNestViewPath}
               onFocusedNestViewPathChange={setFocusedNestViewPath}
               onDrill={(params) => {
                  console.info(params);
               }}
            >
               <div
                  style={{
                     display: "flex",
                     flexDirection: "column",
                     height: "100%",
                  }}
               >
                  <div
                     style={{
                        display: "flex",
                        height: "100%",
                        overflowY: "auto",
                     }}
                  >
                     <ResizableCollapsiblePanel
                        isInitiallyExpanded={true}
                        initialWidth={180}
                        minWidth={180}
                        icon="database"
                        title={sourceAndPath.sourceInfo.name}
                     >
                        <SourcePanel
                           onRefresh={() =>
                              setQuery(emptyQueryExplorerResult())
                           }
                        />
                     </ResizableCollapsiblePanel>
                     <ResizableCollapsiblePanel
                        isInitiallyExpanded={true}
                        initialWidth={280}
                        minWidth={280}
                        icon="filterSliders"
                        title="Query"
                     >
                        <QueryPanel
                           runQuery={() => {
                              mutation.mutate();
                           }}
                        />
                     </ResizableCollapsiblePanel>
                     <ResultPanel
                        source={sourceAndPath.sourceInfo}
                        draftQuery={query?.malloyQuery}
                        setDraftQuery={(malloyQuery) =>
                           setQuery({ ...query, malloyQuery: malloyQuery })
                        }
                        submittedQuery={
                           query?.malloyQuery
                              ? {
                                   executionState: mutation.isPending
                                      ? "running"
                                      : "finished",
                                   response: {
                                      result: query.malloyResult,
                                   },
                                   query: query.malloyQuery,
                                   queryResolutionStartMillis: Date.now(),
                                   onCancel: mutation.reset,
                                }
                              : undefined
                        }
                        options={{ showRawQuery: true }}
                     />
                  </div>
               </div>
            </MalloyExplorerProvider>
         </StyledExplorerContent>
      </StyledExplorerPage>
   );
}
