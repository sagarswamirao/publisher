import { CardActions, Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import {
   StyledCard,
   StyledCardContent,
   StyledCardMedia,
   StyledExplorerContent,
   StyledExplorerPage,
} from "../styles";
import * as Malloy from "@malloydata/malloy-interfaces";
import * as QueryBuilder from "@malloydata/malloy-query-builder";

import React from "react";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { Configuration, QueryresultsApi } from "../../client";
import { usePublisherPackage } from "../Package/PublisherPackageProvider";
import {
   MalloyExplorerProvider,
   QueryPanel,
   ResultPanel,
   SourcePanel,
} from "@malloydata/malloy-explorer";
import { styled } from "@mui/material/styles";

const queryResultsApi = new QueryresultsApi(new Configuration());
const queryClient = new QueryClient();

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
   existingQer?: QueryExplorerResult;
   existingSourceName?: string;
   saveResult?: (
      modelPath: string,
      sourceName: string,
      qer: QueryExplorerResult,
   ) => void;
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
   saveResult,
   existingQer,
   existingSourceName,
}: SourceExplorerProps) {
   const [selectedTab, setSelectedTab] = React.useState(
      existingSourceName
         ? sourceAndPaths.findIndex(
              (entry) => entry.sourceInfo.name === existingSourceName,
           )
         : 0,
   );

   const [qer, setQer] = React.useState<QueryExplorerResult | undefined>(
      existingQer || emptyQueryExplorerResult(),
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
               {saveResult && (
                  <CardActions
                     sx={{
                        padding: "0px 10px 0px 10px",
                        mb: "auto",
                        mt: "auto",
                     }}
                  >
                     <Button
                        onClick={() =>
                           saveResult(
                              sourceAndPaths[selectedTab].modelPath,
                              sourceAndPaths[selectedTab].sourceInfo.name,
                              qer,
                           )
                        }
                     >
                        Save
                     </Button>
                  </CardActions>
               )}
            </Stack>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack spacing={2} component="section">
               <SourceExplorerComponent
                  sourceAndPath={sourceAndPaths[selectedTab]}
                  existingQer={qer}
                  onChange={setQer}
               />
               <Box height="5px" />
            </Stack>
         </StyledCardMedia>
      </StyledCard>
   );
}

interface SourceExplorerComponentProps {
   sourceAndPath: SourceAndPath;
   existingQer?: QueryExplorerResult;
   onChange?: (qer: QueryExplorerResult) => void;
}

export interface QueryExplorerResult {
   query: string | undefined;
   malloyQuery: Malloy.Query;
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
   existingQer,
}: SourceExplorerComponentProps) {
   const [qer, setQer] = React.useState<QueryExplorerResult>(
      existingQer || emptyQueryExplorerResult(),
   );

   React.useEffect(() => {
      if (onChange) {
         onChange(qer);
      }
   }, [onChange, qer]);
   console.log("qer", qer);
   const { server, projectName, packageName, versionId, accessToken } =
      usePublisherPackage();
   const mutation = useMutation(
      {
         mutationFn: () => {
            const malloy = new QueryBuilder.ASTQuery({
               source: sourceAndPath.sourceInfo,
               query: qer?.malloyQuery,
            }).toMalloy();
            setQer({
               ...qer,
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
               {
                  baseURL: server,
                  withCredentials: !accessToken,
                  headers: {
                     Authorization: accessToken && `Bearer ${accessToken}`,
                  },
               },
            );
         },
         onSuccess: (data) => {
            if (data) {
               const parsedResult = JSON.parse(data.data.result);
               setQer({
                  ...qer,
                  malloyResult: parsedResult as Malloy.Result,
               });
            }
         },
      },
      queryClient,
   );

   const [oldSourceInfo, setOldSourceInfo] = React.useState(
      sourceAndPath.sourceInfo.name,
   );

   // This hack is needed since sourceInfo is updated before
   // query is reset, which results in the query not being found
   // because it does not exist on the new source.
   React.useEffect(() => {
      if (oldSourceInfo !== sourceAndPath.sourceInfo.name) {
         setOldSourceInfo(sourceAndPath.sourceInfo.name);
         setQer(emptyQueryExplorerResult());
      }
   }, [sourceAndPath, oldSourceInfo]);

   if (oldSourceInfo !== sourceAndPath.sourceInfo.name) {
      return <div>Loading...</div>;
   }

   return (
      <StyledExplorerPage key={sourceAndPath.sourceInfo.name}>
         <StyledExplorerContent>
            <MalloyExplorerProvider
               source={sourceAndPath.sourceInfo}
               query={qer?.malloyQuery}
               setQuery={(query) => setQer({ ...qer, malloyQuery: query })}
            >
               <div style={{ height: "100%", width: "20%" }}>
                  <SourcePanel
                     onRefresh={() => setQer(emptyQueryExplorerResult())}
                  />
               </div>
               <div style={{ height: "100%", width: "30%" }}>
                  <QueryPanel
                     runQuery={() => {
                        mutation.mutate();
                     }}
                  />
               </div>
               <div style={{ height: "100%", width: "50%" }}>
                  <ResultPanel
                     source={sourceAndPath.sourceInfo}
                     draftQuery={qer?.malloyQuery}
                     setDraftQuery={(malloyQuery) =>
                        setQer({ ...qer, malloyQuery: malloyQuery })
                     }
                     submittedQuery={
                        qer?.malloyQuery
                           ? {
                                executionState: mutation.isPending
                                   ? "running"
                                   : "finished",
                                response: {
                                   result: qer.malloyResult,
                                },
                                query: qer.malloyQuery,
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
      </StyledExplorerPage>
   );
}
