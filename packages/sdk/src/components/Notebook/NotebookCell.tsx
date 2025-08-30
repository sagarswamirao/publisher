import CodeIcon from "@mui/icons-material/Code";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
   IconButton,
   Stack,
   Tooltip,
   Typography,
   Box,
   Dialog,
   DialogTitle,
   DialogContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Markdown from "markdown-to-jsx";
import React, { useEffect } from "react";
import { NotebookCell as ClientNotebookCell } from "../../client";
import { highlight } from "../highlighter";
import { ModelExplorer } from "../Model";
import { ModelExplorerDialog } from "../Model/ModelExplorerDialog";
import ResultContainer from "../RenderedResult/ResultContainer";
import { CleanNotebookCell, CleanMetricCard } from "../styles";
import { usePackage } from "../Package";
import { createEmbeddedQueryResult } from "../QueryResult/QueryResult";

// Regex to extract model path from import statements like: import {flights} from 'flights.malloy'
const IMPORT_REGEX = /import\s*\{[^}]*\}\s*from\s*['"`]([^'"`]+)['"`]/;

interface NotebookCellProps {
   cell: ClientNotebookCell;
   notebookPath: string;
   expandCodeCell?: boolean;
   hideCodeCellIcon?: boolean;
   expandEmbedding?: boolean;
   hideEmbeddingIcon?: boolean;
}

export function NotebookCell({
   cell,
   notebookPath,
   hideCodeCellIcon,
   hideEmbeddingIcon,
}: NotebookCellProps) {
   const [codeDialogOpen, setCodeDialogOpen] = React.useState<boolean>(false);
   const [embeddingDialogOpen, setEmbeddingDialogOpen] =
      React.useState<boolean>(false);
   const [resultsDialogOpen, setResultsDialogOpen] =
      React.useState<boolean>(false);
   const [highlightedMalloyCode, setHighlightedMalloyCode] =
      React.useState<string>();
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const [sourcesDialogOpen, setSourcesDialogOpen] =
      React.useState<boolean>(false);
   const { packageName, projectName } = usePackage();

   // Extract model path from import statement in cell text
   const importMatch = cell.text.match(IMPORT_REGEX);
   const modelPath = importMatch ? importMatch[1] : null;
   const hasValidImport = !!importMatch;

   const queryResultCodeSnippet = createEmbeddedQueryResult({
      modelPath: notebookPath,
      query: cell.text,
      optionalPackageName: packageName,
      optionalProjectName: projectName,
   });

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
         <CleanNotebookCell>
            <Box
               sx={{
                  "& h1, & h2, & h3, & h4, & h5, & h6": {
                     fontWeight: "600",
                     color: "#1a1a1a",
                     marginBottom: "8px",
                     marginTop: "16px",
                  },
                  "& h1": { fontSize: "28px" },
                  "& h2": { fontSize: "24px" },
                  "& h3": { fontSize: "20px" },
                  "& p": {
                     color: "#333333",
                     lineHeight: "1.7",
                     marginBottom: "8px",
                     fontSize: "16px",
                  },
                  "& ul, & ol": {
                     color: "#333333",
                     lineHeight: "1.7",
                     marginBottom: "8px",
                     fontSize: "16px",
                  },
                  "& li": {
                     marginBottom: "4px",
                  },
               }}
            >
               <Markdown>{cell.text}</Markdown>
            </Box>
         </CleanNotebookCell>
      )) ||
      (cell.type === "code" && (
         <CleanNotebookCell>
            {(!hideCodeCellIcon ||
               (!hideEmbeddingIcon && cell.result) ||
               (cell.newSources && cell.newSources.length > 0)) && (
               <Stack
                  sx={{
                     flexDirection: "column",
                     gap: "8px",
                     marginBottom: "16px",
                  }}
               >
                  {cell.newSources &&
                     cell.newSources.length > 0 &&
                     hasValidImport && (
                        <CleanMetricCard
                           sx={{
                              position: "relative",
                              padding: "0",
                           }}
                        >
                           <Box
                              sx={{
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "space-between",
                                 paddingLeft: "24px",
                                 paddingRight: "8px",
                              }}
                           >
                              <span
                                 dangerouslySetInnerHTML={{
                                    __html:
                                       cell.text.length > 50
                                          ? `${highlightedMalloyCode.substring(0, 50)}...`
                                          : highlightedMalloyCode,
                                 }}
                                 style={{
                                    fontFamily: "monospace",
                                    fontSize: "14px",
                                    flex: 1,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    marginRight: "8px",
                                 }}
                              />
                              <IconButton
                                 sx={{
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    "&:hover": {
                                       backgroundColor:
                                          "rgba(255, 255, 255, 1)",
                                    },
                                    width: "32px",
                                    height: "32px",
                                    flexShrink: 0,
                                 }}
                                 onClick={() => setSourcesDialogOpen(true)}
                              >
                                 <SearchIcon
                                    sx={{ fontSize: "18px", color: "#666666" }}
                                 />
                              </IconButton>
                           </Box>
                        </CleanMetricCard>
                     )}
               </Stack>
            )}

            {/* Data Sources Dialog */}
            <ModelExplorerDialog
               open={sourcesDialogOpen}
               onClose={() => setSourcesDialogOpen(false)}
               modelPath={modelPath || ""}
               title="Data Sources"
               hasValidImport={hasValidImport}
            />

            {/* Code Dialog */}
            <Dialog
               open={codeDialogOpen}
               onClose={() => setCodeDialogOpen(false)}
               maxWidth="lg"
               fullWidth
            >
               <DialogTitle
                  sx={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "center",
                  }}
               >
                  Malloy Code
                  <IconButton
                     onClick={() => setCodeDialogOpen(false)}
                     sx={{ color: "#666666" }}
                  >
                     <CloseIcon />
                  </IconButton>
               </DialogTitle>
               <DialogContent>
                  <pre
                     className="code-display"
                     dangerouslySetInnerHTML={{
                        __html: highlightedMalloyCode,
                     }}
                  />
               </DialogContent>
            </Dialog>

            {/* Embedding Dialog */}
            <Dialog
               open={embeddingDialogOpen}
               onClose={() => setEmbeddingDialogOpen(false)}
               maxWidth="lg"
               fullWidth
            >
               <DialogTitle
                  sx={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "center",
                  }}
               >
                  Embeddable Code
                  <IconButton
                     onClick={() => setEmbeddingDialogOpen(false)}
                     sx={{ color: "#666666" }}
                  >
                     <CloseIcon />
                  </IconButton>
               </DialogTitle>
               <DialogContent>
                  <Stack
                     sx={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                     }}
                  >
                     <Typography
                        component="div"
                        sx={{
                           fontSize: "12px",
                           fontFamily: "monospace",
                           "& .line": { textWrap: "wrap" },
                           flex: 1,
                        }}
                        dangerouslySetInnerHTML={{
                           __html: highlightedEmbedCode,
                        }}
                     />
                     <Tooltip title="Copy Embeddable Code">
                        <IconButton
                           sx={{
                              width: "24px",
                              height: "24px",
                              marginLeft: "8px",
                              color: "#666666",
                           }}
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
               </DialogContent>
            </Dialog>

            {/* Results Dialog */}
            <Dialog
               open={resultsDialogOpen}
               onClose={() => setResultsDialogOpen(false)}
               maxWidth={false}
               fullWidth
               sx={{
                  "& .MuiDialog-paper": {
                     width: "95vw",
                     height: "95vh",
                     maxWidth: "none",
                  },
               }}
            >
               <DialogTitle
                  sx={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "center",
                  }}
               >
                  Results
                  <IconButton
                     onClick={() => setResultsDialogOpen(false)}
                     sx={{ color: "#666666" }}
                  >
                     <CloseIcon />
                  </IconButton>
               </DialogTitle>
               <DialogContent
                  sx={{
                     height: "calc(95vh - 120px)",
                     overflow: "auto",
                     padding: "0 16px",
                  }}
               >
                  <ResultContainer
                     result={cell.result}
                     minHeight={800}
                     maxHeight={800}
                     hideToggle={true}
                  />
               </DialogContent>
            </Dialog>

            {cell.result && (
               <CleanMetricCard
                  sx={{
                     position: "relative",
                  }}
               >
                  <Box
                     sx={{
                        paddingTop: "24px",
                     }}
                  >
                     <ResultContainer
                        result={cell.result}
                        minHeight={300}
                        maxHeight={1000}
                     />
                  </Box>

                  {/* Fade effect at bottom to indicate more content */}
                  <Box
                     sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "40px",
                        background:
                           "linear-gradient(transparent, rgba(255, 255, 255, 0.9))",
                        pointerEvents: "none",
                        zIndex: 1,
                     }}
                  />

                  {/* Top right corner controls */}
                  <Stack
                     sx={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        flexDirection: "row",
                        gap: "8px",
                        alignItems: "center",
                        zIndex: 2,
                     }}
                  >
                     {!hideCodeCellIcon && (
                        <IconButton
                           sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              "&:hover": {
                                 backgroundColor: "rgba(255, 255, 255, 1)",
                              },
                              width: "32px",
                              height: "32px",
                           }}
                           onClick={(e) => {
                              e.stopPropagation();
                              setCodeDialogOpen(true);
                           }}
                        >
                           <CodeIcon
                              sx={{ fontSize: "18px", color: "#666666" }}
                           />
                        </IconButton>
                     )}
                     <IconButton
                        sx={{
                           backgroundColor: "rgba(255, 255, 255, 0.9)",
                           "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 1)",
                           },
                           width: "32px",
                           height: "32px",
                        }}
                        onClick={() => setResultsDialogOpen(true)}
                     >
                        <SearchIcon
                           sx={{ fontSize: "18px", color: "#666666" }}
                        />
                     </IconButton>
                  </Stack>
               </CleanMetricCard>
            )}
         </CleanNotebookCell>
      ))
   );
}
