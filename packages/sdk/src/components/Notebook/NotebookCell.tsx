import * as Malloy from "@malloydata/malloy-interfaces";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
   CardActions,
   Collapse,
   IconButton,
   Stack,
   Tooltip,
   Typography,
} from "@mui/material";
import Markdown from "markdown-to-jsx";
import React, { useEffect } from "react";
import { NotebookCell as ClientNotebookCell } from "../../client";
import { highlight } from "../highlighter";
import { SourcesExplorer } from "../Model";
import ResultContainer from "../RenderedResult/ResultContainer";
import { StyledCard, StyledCardContent } from "../styles";

// Add global style for code display
const codeStyle = `
  .code-display pre {
    margin: 0;
    padding: 0;
  }
`;

interface NotebookCellProps {
   cell: ClientNotebookCell;
   notebookPath: string;
   queryResultCodeSnippet: string;
   expandCodeCell?: boolean;
   hideCodeCellIcon?: boolean;
   expandEmbedding?: boolean;
   hideEmbeddingIcon?: boolean;
}

export function NotebookCell({
   cell,
   notebookPath,
   queryResultCodeSnippet,
   expandCodeCell,
   hideCodeCellIcon,
   expandEmbedding,
   hideEmbeddingIcon,
}: NotebookCellProps) {
   const [codeExpanded, setCodeExpanded] =
      React.useState<boolean>(expandCodeCell);
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(expandEmbedding);
   const [highlightedMalloyCode, setHighlightedMalloyCode] =
      React.useState<string>();
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const [sourcesExpanded, setSourcesExpanded] = React.useState<boolean>(false);
   useEffect(() => {
      if (cell.type === "code")
         highlight(cell.text, "malloy").then((code) => {
            setHighlightedMalloyCode(code);
         });
   }, [cell]);

   useEffect(() => {
      highlight(queryResultCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [queryResultCodeSnippet]);

   return (
      (cell.type === "markdown" && (
         <StyledCard variant="outlined" sx={{ border: 0 }}>
            <StyledCardContent>
               <Markdown>{cell.text}</Markdown>
            </StyledCardContent>
         </StyledCard>
      )) ||
      (cell.type === "code" && (
         <StyledCard variant="outlined" sx={{ height: "auto" }}>
            {(!hideCodeCellIcon || (!hideEmbeddingIcon && cell.result)) && (
               <Stack
                  sx={{
                     flexDirection: "row",
                     justifyContent: "right",
                  }}
               >
                  <CardActions
                     sx={{
                        padding: "0px 10px 0px 10px",
                        mb: "auto",
                        mt: "auto",
                     }}
                  >
                     {cell.newSources && cell.newSources.length > 0 && (
                        <Tooltip title="Explore Data Sources">
                           <IconButton
                              size="small"
                              onClick={() => {
                                 setSourcesExpanded(!sourcesExpanded);
                                 setEmbeddingExpanded(false);
                                 setCodeExpanded(false);
                              }}
                           >
                              <svg
                                 width="24"
                                 height="24"
                                 viewBox="0 0 24 24"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg"
                              >
                                 <path
                                    d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"
                                    fill="currentColor"
                                 />
                              </svg>
                           </IconButton>
                        </Tooltip>
                     )}
                     {!hideCodeCellIcon && (
                        <Tooltip
                           title={codeExpanded ? "Hide Code" : "View Code"}
                        >
                           <IconButton
                              size="small"
                              onClick={() => {
                                 setCodeExpanded(!codeExpanded);
                              }}
                           >
                              <CodeIcon />
                           </IconButton>
                        </Tooltip>
                     )}
                     {!hideEmbeddingIcon && cell.result && (
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
                     )}
                  </CardActions>
               </Stack>
            )}
            <Collapse in={embeddingExpanded} timeout="auto" unmountOnExit>
               <Stack
                  sx={{
                     p: "10px",
                     borderRadius: 0,
                     flexDirection: "row",
                     justifyContent: "space-between",
                  }}
               >
                  <Typography
                     component="div"
                     sx={{
                        fontSize: "12px",
                        "& .line": { textWrap: "wrap" },
                     }}
                     dangerouslySetInnerHTML={{
                        __html: highlightedEmbedCode,
                     }}
                  />
                  <Tooltip title="Copy Embeddable Code">
                     <IconButton
                        sx={{ width: "24px", height: "24px" }}
                        onClick={() => {
                           navigator.clipboard.writeText(
                              queryResultCodeSnippet,
                           );
                        }}
                     >
                        <ContentCopyIcon />
                     </IconButton>
                  </Tooltip>
               </Stack>
            </Collapse>
            <Collapse in={codeExpanded} timeout="auto" unmountOnExit>
               <style>{codeStyle}</style>
               <Stack
                  sx={{
                     mx: "15px",
                     mb: "10px",
                     borderRadius: 0,
                     flexDirection: "row",
                     justifyContent: "space-between",
                  }}
               >
                  <div
                     className="code-display"
                     style={{
                        fontSize: "12px",
                        width: "800px",
                        border: "1px solid rgb(220,220,220)",
                     }}
                     dangerouslySetInnerHTML={{
                        __html: highlightedMalloyCode,
                     }}
                  />
               </Stack>
            </Collapse>
            <Collapse
               in={sourcesExpanded}
               timeout="auto"
               unmountOnExit
               sx={{ p: "5px" }}
            >
               <SourcesExplorer
                  sourceAndPaths={cell.newSources.map((source) => {
                     const sourceInfo = JSON.parse(source) as Malloy.SourceInfo;
                     return {
                        sourceInfo: sourceInfo,
                        modelPath: notebookPath,
                     };
                  })}
               />
            </Collapse>
            {cell.result && !sourcesExpanded && (
               <>
                  <ResultContainer
                     result={cell.result}
                     minHeight={300}
                     maxHeight={700}
                  />
               </>
            )}
         </StyledCard>
      ))
   );
}
