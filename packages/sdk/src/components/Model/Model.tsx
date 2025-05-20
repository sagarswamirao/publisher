import React, { useEffect } from "react";
import {
   Box,
   Typography,
   Stack,
   CardActions,
   Tooltip,
   IconButton,
   Collapse,
   Divider,
   Tabs,
   Tab,
} from "@mui/material";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axios from "axios";
import { Configuration, ModelsApi, QueryresultsApi } from "../../client";
import { ModelCell } from "./ModelCell";
import {
   StyledCard,
   StyledCardContent,
   StyledCardMedia,
   StyledExplorerContent,
   StyledExplorerPage,
} from "../styles";
import { highlight } from "../highlighter";
import {
   MalloyExplorerProvider,
   SourcePanel,
   QueryPanel,
   ResultPanel,
} from "@malloydata/malloy-explorer";
import * as Malloy from "@malloydata/malloy-interfaces";
import * as QueryBuilder from "@malloydata/malloy-query-builder";

import "@malloydata/malloy-explorer/styles.css";
axios.defaults.baseURL = "http://localhost:4000";
const modelsApi = new ModelsApi(new Configuration());
const queryResultsApi = new QueryresultsApi(new Configuration());

const queryClient = new QueryClient();

interface ModelProps {
   server?: string;
   projectName: string;
   packageName: string;
   modelPath: string;
   versionId?: string;
   expandResults?: boolean;
   hideResultIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
   accessToken?: string;
}

// Note: For this to properly render outside of publisher,
// you must explicitly import the styles from the package:
// import "@malloy-publisher/sdk/malloy-explorer.css";

export default function Model({
   server,
   projectName,
   packageName,
   modelPath,
   versionId,
   expandResults,
   hideResultIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
   accessToken,
}: ModelProps) {
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(false);
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const [selectedTab, setSelectedTab] = React.useState(0);

   const modelCodeSnippet = getModelCodeSnippet(server, packageName, modelPath);

   useEffect(() => {
      highlight(modelCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [embeddingExpanded, modelCodeSnippet]);

   const { data, isError, isLoading, error } = useQuery(
      {
         queryKey: [
            "package",
            server,
            projectName,
            packageName,
            modelPath,
            versionId,
         ],
         queryFn: () =>
            modelsApi.getModel(projectName, packageName, modelPath, versionId, {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
      },
      queryClient,
   );

   if (isLoading) {
      return (
         <Typography sx={{ p: "20px", m: "auto" }}>
            Fetching Model...
         </Typography>
      );
   }

   if (isError) {
      return (
         <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
            {`${packageName} > ${modelPath} > ${versionId} - ${error.message}`}
         </Typography>
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
               {Array.isArray(data.data.sourceInfos) &&
                  data.data.sourceInfos.length > 0 && (
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
                        {data.data.sourceInfos.map((source, idx) => {
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
                  )}
               <CardActions
                  sx={{
                     padding: "0px 10px 0px 10px",
                     mb: "auto",
                     mt: "auto",
                  }}
               >
                  <Tooltip
                     title={
                        embeddingExpanded ? "Hide Embedding" : "View Embedding"
                     }
                  >
                     <IconButton
                        size="small"
                        onClick={() => {
                           setEmbeddingExpanded(!embeddingExpanded);
                        }}
                     >
                        <LinkOutlinedIcon />
                     </IconButton>
                  </Tooltip>
               </CardActions>
            </Stack>
            <Collapse in={embeddingExpanded} timeout="auto" unmountOnExit>
               <Divider />
               <Stack
                  sx={{
                     p: "10px",
                     borderRadius: 0,
                     flexDirection: "row",
                     justifyContent: "space-between",
                  }}
               >
                  <Typography
                     sx={{
                        fontSize: "12px",
                        "& .line": { textWrap: "wrap" },
                     }}
                  >
                     <div
                        dangerouslySetInnerHTML={{
                           __html: highlightedEmbedCode,
                        }}
                     />
                  </Typography>
                  <Tooltip title="Copy Embeddable Code">
                     <IconButton
                        sx={{ width: "24px", height: "24px" }}
                        onClick={() => {
                           navigator.clipboard.writeText(modelCodeSnippet);
                        }}
                     >
                        <ContentCopyIcon />
                     </IconButton>
                  </Tooltip>
               </Stack>
            </Collapse>
            <Divider />
         </StyledCardContent>
         <StyledCardMedia>
            <Stack spacing={2} component="section">
               {/* Only render the selected sourceInfo */}
               {Array.isArray(data.data.sourceInfos) &&
                  data.data.sourceInfos.length > 0 && (
                     <SourceExplorerComponent
                        server={server}
                        versionId={versionId}
                        accessToken={accessToken}
                        modelPath={modelPath}
                        projectName={projectName}
                        packageName={packageName}
                        source={data.data.sourceInfos[selectedTab]}
                     />
                  )}
               {data.data.queries?.length > 0 && (
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
                        {data.data.queries.map((query) => (
                           <ModelCell
                              key={query.name}
                              server={server}
                              projectName={projectName}
                              packageName={packageName}
                              modelPath={modelPath}
                              versionId={versionId}
                              queryName={query.name}
                              expandResult={expandResults}
                              hideResultIcon={hideResultIcons}
                              expandEmbedding={expandEmbeddings}
                              hideEmbeddingIcon={hideEmbeddingIcons}
                              accessToken={accessToken}
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

function getModelCodeSnippet(
   server: string,
   packageName: string,
   modelPath: string,
): string {
   return `<Model
   server="${server}"
   packageName="${packageName}"
   modelPath="${modelPath}"
   accessToken={accessToken}
/>`;
}

function SourceExplorerComponent({
   server,
   versionId,
   accessToken,
   modelPath,
   projectName,
   packageName,
   source,
}) {
   const [query, setQuery] = React.useState<Malloy.Query | undefined>(
      undefined,
   );
   const [result, setResult] = React.useState<Malloy.Result | undefined>(
      undefined,
   );

   if (!source) return null;
   let sourceInfo;
   try {
      sourceInfo = JSON.parse(source);
   } catch {
      return null;
   }

   const mutation = useMutation(
      {
         mutationFn: () =>
            queryResultsApi.executeQuery(
               projectName,
               packageName,
               modelPath,
               new QueryBuilder.ASTQuery({
                  source: sourceInfo,
                  query,
               }).toMalloy(),
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
            ),
         onSuccess: (data) => {
            if (data) {
               const parsedResult = JSON.parse(data.data.result);
               setResult(parsedResult as Malloy.Result);
            }
         },
      },
      queryClient,
   );

   const [oldSourceInfo, setOldSourceInfo] = React.useState(sourceInfo.name);

   // This hack is needed since sourceInfo is updated before
   // query is reset, which results in the query not being found
   // because it does not exist on the new source.
   React.useEffect(() => {
      if (oldSourceInfo !== sourceInfo.name) {
         setOldSourceInfo(sourceInfo.name);
         setQuery(undefined);
         setResult(undefined);
      }
   }, [source, sourceInfo]);

   if (oldSourceInfo !== sourceInfo.name) {
      return <div>Loading...</div>;
   }

   return (
      <StyledExplorerPage key={sourceInfo.name}>
         <StyledExplorerContent>
            <MalloyExplorerProvider
               source={sourceInfo}
               query={query}
               setQuery={setQuery}
            >
               <div style={{ height: "100%", width: "20%" }}>
                  <SourcePanel
                     onRefresh={() => {
                        setQuery(undefined);
                        setResult(undefined);
                     }}
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
                     source={sourceInfo}
                     draftQuery={query}
                     setDraftQuery={setQuery}
                     submittedQuery={
                        query
                           ? {
                                executionState: mutation.isPending
                                   ? "running"
                                   : "finished",
                                response: {
                                   result: result,
                                },
                                query,
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
