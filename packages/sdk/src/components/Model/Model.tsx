import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
   Box,
   CardActions,
   Collapse,
   Divider,
   IconButton,
   Stack,
   Tab,
   Tabs,
   Tooltip,
   Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { Configuration, ModelsApi, CompiledModel } from "../../client";
import { highlight } from "../highlighter";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { ModelCell } from "./ModelCell";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

import "@malloydata/malloy-explorer/styles.css";
import { usePackage } from "../Package/PackageProvider";
import { SourceExplorerComponent } from "./SourcesExplorer";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { useServer } from "../ServerProvider";

const modelsApi = new ModelsApi(new Configuration());

interface ModelProps {
   modelPath: string;
   versionId?: string;
   expandResults?: boolean;
   hideResultIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
}

// Note: For this to properly render outside of publisher,
// you must explicitly import the styles from the package:
// import "@malloy-publisher/sdk/malloy-explorer.css";

export default function Model({
   modelPath,
   expandResults,
   hideResultIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
}: ModelProps) {
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(false);
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const [selectedTab, setSelectedTab] = React.useState(0);

   const { projectName, packageName, versionId } = usePackage();
   const { server, accessToken } = useServer();
   const modelCodeSnippet = getModelCodeSnippet(server, packageName, modelPath);
   useEffect(() => {
      highlight(modelCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [embeddingExpanded, modelCodeSnippet]);

   const { data, isError, isLoading, error } =
      useQueryWithApiError<CompiledModel>({
         queryKey: [
            "package",
            server,
            projectName,
            packageName,
            modelPath,
            versionId,
         ],
         queryFn: async () => {
            const response = await modelsApi.getModel(
               projectName,
               packageName,
               modelPath,
               versionId,
               {
                  baseURL: server,
                  withCredentials: !accessToken,
                  headers: {
                     Authorization: accessToken && `Bearer ${accessToken}`,
                  },
               },
            );
            return response.data;
         },
      });

   if (isLoading) {
      return <Loading text="Fetching Model..." />;
   }

   if (isError) {
      console.log("error", error);
      return (
         <ApiErrorDisplay
            error={error}
            context={`${packageName} > ${modelPath}`}
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
               {Array.isArray(data.sourceInfos) &&
                  data.sourceInfos.length > 0 && (
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
                  )}
               {!hideEmbeddingIcons && (
                  <CardActions
                     sx={{
                        padding: "0px 10px 0px 10px",
                        mb: "auto",
                        mt: "auto",
                     }}
                  >
                     <Tooltip
                        title={
                           embeddingExpanded
                              ? "Hide Embedding"
                              : "View Embedding"
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
               )}
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
               {Array.isArray(data.sourceInfos) &&
                  data.sourceInfos.length > 0 && (
                     <SourceExplorerComponent
                        sourceAndPath={{
                           modelPath,
                           sourceInfo: JSON.parse(
                              data.sourceInfos[selectedTab],
                           ),
                        }}
                     />
                  )}
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
