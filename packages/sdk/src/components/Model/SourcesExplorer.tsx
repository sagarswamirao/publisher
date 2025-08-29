import * as Malloy from "@malloydata/malloy-interfaces";
import { Box, Stack } from "@mui/system";
import {
   StyledCardMedia,
   StyledExplorerContent,
   StyledExplorerPage,
} from "../styles";

import React, { useState, useEffect } from "react";
import { Configuration, QueryresultsApi } from "../../client";
import { useMutationWithApiError } from "../../hooks/useQueryWithApiError";
import { usePackage } from "../Package/PackageProvider";

type ExplorerComponents = typeof import("@malloydata/malloy-explorer");
type QueryBuilder = typeof import("@malloydata/malloy-query-builder");

const queryResultsApi = new QueryresultsApi(new Configuration());

export interface SourceAndPath {
   modelPath: string;
   sourceInfo: Malloy.SourceInfo;
}

export interface SourceExplorerProps {
   sourceAndPaths: SourceAndPath[];
   selectedSourceIndex: number;
   existingQuery?: QueryExplorerResult;
   onQueryChange?: (query: QueryExplorerResult) => void;
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
   selectedSourceIndex,
   existingQuery,
   onQueryChange,
}: SourceExplorerProps) {
   const [query, setQuery] = React.useState<QueryExplorerResult | undefined>(
      existingQuery || emptyQueryExplorerResult(),
   );

   return (
      <StyledCardMedia>
         <Stack spacing={2} component="section">
            <SourceExplorerComponent
               sourceAndPath={sourceAndPaths[selectedSourceIndex]}
               existingQuery={query}
               onChange={(query) => {
                  setQuery(query);
                  if (onQueryChange) {
                     onQueryChange(query);
                  }
               }}
            />
            <Box height="5px" />
         </Stack>
      </StyledCardMedia>
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
function SourceExplorerComponentInner({
   sourceAndPath,
   onChange,
   existingQuery,
   explorerComponents,
   QueryBuilder,
}: SourceExplorerComponentProps & {
   explorerComponents: ExplorerComponents;
   QueryBuilder: QueryBuilder;
}) {
   const [query, setQuery] = React.useState<QueryExplorerResult>(
      existingQuery || emptyQueryExplorerResult(),
   );
   const [focusedNestViewPath, setFocusedNestViewPath] = React.useState<
      string[]
   >([]);

   const {
      MalloyExplorerProvider,
      QueryPanel,
      ResizableCollapsiblePanel,
      ResultPanel,
      SourcePanel,
   } = explorerComponents;

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
         setQuery({ ...query, malloyQuery, malloyResult: undefined });
      },
      [query],
   );

   if (oldSourceInfo !== sourceAndPath.sourceInfo.name) {
      return <div>Loading...</div>;
   }
   return (
      <StyledExplorerContent
         key={sourceAndPath.sourceInfo.name}
         sx={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
         }}
      >
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
                     onRefresh={() => setQuery(emptyQueryExplorerResult())}
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
         </MalloyExplorerProvider>
      </StyledExplorerContent>
   );
}

// Lazy-loaded wrapper component
export function SourceExplorerComponent(props: SourceExplorerComponentProps) {
   const [explorerComponents, setExplorerComponents] =
      useState<ExplorerComponents | null>(null);
   const [QueryBuilder, setQueryBuilder] = useState<QueryBuilder | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let isMounted = true;

      Promise.all([
         import("@malloydata/malloy-explorer"),
         import("@malloydata/malloy-query-builder"),
      ])
         .then(([explorerComponents, queryBuilder]) => {
            if (isMounted) {
               setExplorerComponents(explorerComponents);
               setQueryBuilder(queryBuilder);
               setLoading(false);
            }
         })
         .catch((error) => {
            console.error("Failed to load Malloy components:", error);
            if (isMounted) {
               setLoading(false);
            }
         });

      return () => {
         isMounted = false;
      };
   }, []);

   if (loading || !explorerComponents || !QueryBuilder) {
      return (
         <StyledExplorerPage>
            <StyledExplorerContent>
               <div
                  style={{
                     alignItems: "center",
                     justifyContent: "center",
                     height: "200px",
                     color: "#666",
                  }}
               >
                  Loading explorer...
               </div>
            </StyledExplorerContent>
         </StyledExplorerPage>
      );
   }

   return (
      <SourceExplorerComponentInner
         {...props}
         explorerComponents={explorerComponents}
         QueryBuilder={QueryBuilder}
      />
   );
}
