import * as Malloy from "@malloydata/malloy-interfaces";
import CodeIcon from "@mui/icons-material/Code";
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
   Box,
} from "@mui/material";
import Markdown from "markdown-to-jsx";
import React, { Suspense, lazy, useEffect } from "react";
import { NotebookCell as ClientNotebookCell } from "../../client";
import { highlight } from "../highlighter";
import { SourcesExplorer } from "../Model";
import { StyledCard, StyledCardContent } from "../styles";
import ResultContainer from "../RenderedResult/ResultContainer";

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
   const [codeExpanded, setCodeExpanded] = React.useState<boolean>(
      expandCodeCell || (cell.type === "code" && !cell.result),
   );
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
               <Stack sx={{ flexDirection: "row", justifyContent: "right" }}>
                  <CardActions
                     sx={{
                        padding: "0px 10px 0px 10px",
                        mb: "auto",
                        mt: "auto",
                     }}
                  >
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
                  </CardActions>
               </Stack>
            )}
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
                     component="div"
                     className="content"
                     sx={{ fontSize: "12px", "& .line": { textWrap: "wrap" } }}
                     dangerouslySetInnerHTML={{
                        __html: highlightedMalloyCode,
                     }}
                  />
               </Stack>
            </Collapse>
            <Collapse in={sourcesExpanded} timeout="auto" unmountOnExit>
               <Stack sx={{ p: "10px" }}>
                  <Typography>Sources</Typography>
               </Stack>
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
                     minHeight={200}
                     maxHeight={800}
                  />
               </>
            )}
         </StyledCard>
      ))
   );
}
