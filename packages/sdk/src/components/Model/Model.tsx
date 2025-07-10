import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
   CardActions,
   Collapse,
   Divider,
   IconButton,
   Stack,
   Tooltip,
   Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { highlight } from "../highlighter";
import { StyledCard, StyledCardContent } from "../styles";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

import "@malloydata/malloy-explorer/styles.css";
import { QueryExplorerResult } from "./SourcesExplorer";
import { Loading } from "../Loading";
import { ModelExplorer } from "./ModelExplorer";
import { useModelData } from "./useModelData";

interface ModelProps {
   modelPath: string;
   versionId?: string;
   expandResults?: boolean;
   hideResultIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
   onChange?: (query: QueryExplorerResult) => void;
}

// Note: For this to properly render outside of publisher,
// you must explicitly import the styles from the package:
// import "@malloy-publisher/sdk/malloy-explorer.css";

export default function Model({
   modelPath,
   versionId,
   expandResults,
   hideResultIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
   onChange,
}: ModelProps) {
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(false);
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();

   const { isError, isLoading, error } = useModelData(modelPath, versionId);
   const modelCodeSnippet = getModelCodeSnippet(modelPath);
   useEffect(() => {
      highlight(modelCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [embeddingExpanded, modelCodeSnippet]);

   if (isLoading) {
      return <Loading text="Fetching Model..." />;
   }

   if (isError) {
      console.log("error", error);
      return <ApiErrorDisplay error={error} context={`Model > ${modelPath}`} />;
   }
   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
               }}
            >
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
         <ModelExplorer
            modelPath={modelPath}
            versionId={versionId}
            expandResults={expandResults}
            hideResultIcons={hideResultIcons}
            expandEmbeddings={expandEmbeddings}
            hideEmbeddingIcons={hideEmbeddingIcons}
            onChange={onChange}
         />
      </StyledCard>
   );
}

function getModelCodeSnippet(modelPath: string): string {
   return `<Model
   modelPath="${modelPath}"
   accessToken={accessToken}
/>`;
}
