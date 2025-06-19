import React from "react";
import {
   styled,
   Collapse,
   CardActions,
   Card,
   CardContent,
   Divider,
   Stack,
   Typography,
   Tooltip,
   IconButton,
} from "@mui/material";
import { QueryResult } from "../QueryResult";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect } from "react";
import { highlight } from "../highlighter";

const StyledCard = styled(Card)({
   display: "flex",
   flexDirection: "column",
   height: "100%",
});

interface ModelCellProps {
   modelPath: string;
   sourceName?: string;
   queryName: string;
   expandResult?: boolean;
   hideResultIcon?: boolean;
   expandEmbedding?: boolean;
   hideEmbeddingIcon?: boolean;
   noView?: boolean;
   annotations?: string[];
}

export function ModelCell({
   modelPath,
   sourceName,
   queryName,
   expandResult,
   hideResultIcon,
   expandEmbedding,
   hideEmbeddingIcon,
   noView,
   annotations,
}: ModelCellProps) {
   const [resultsExpanded, setResultsExpanded] = React.useState(expandResult);
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(expandEmbedding);
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const [highlightedAnnotations, setHighlightedAnnotations] =
      React.useState<string>();

   const queryResultCodeSnippet = getQueryResultCodeSnippet(
      sourceName,
      queryName,
   );

   useEffect(() => {
      highlight(queryResultCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [embeddingExpanded, queryResultCodeSnippet]);

   useEffect(() => {
      if (annotations && annotations.length > 0) {
         const code = annotations
            .map((annotation) => `// ${annotation}`)
            .join("\n");
         highlight(code, "typescript").then((highlightedCode) => {
            setHighlightedAnnotations(highlightedCode);
         });
      }
   }, [annotations]);

   return (
      <>
         <StyledCard
            variant="outlined"
            sx={{
               padding: "0px 10px 0px 10px",
               borderRadius: "0px",
            }}
         >
            <Stack
               sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
               }}
            >
               <Typography
                  variant="subtitle2"
                  sx={{ mt: "auto", mb: "auto" }}
               >{`${noView ? "" : "View >"} ${queryName}`}</Typography>
               <CardActions sx={{ padding: "0px" }}>
                  {!hideResultIcon && (
                     <Tooltip
                        title={
                           resultsExpanded ? "Hide Results" : "Show Results"
                        }
                     >
                        <IconButton
                           size="small"
                           onClick={() => {
                              setResultsExpanded(!resultsExpanded);
                           }}
                        >
                           <AnalyticsOutlinedIcon />
                        </IconButton>
                     </Tooltip>
                  )}
                  {!hideEmbeddingIcon && (
                     <Tooltip
                        title={
                           embeddingExpanded ? "Hide Sharing" : "Show Sharing"
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
            <Collapse in={resultsExpanded} timeout="auto" unmountOnExit>
               <Divider sx={{ mb: "10px" }} />
               {highlightedAnnotations && (
                  <>
                     <Stack
                        sx={{
                           borderRadius: 0,
                           flexDirection: "row",
                           justifyContent: "space-between",
                        }}
                     >
                        <Typography
                           fontSize="12px"
                           sx={{
                              fontSize: "12px",
                              "& .line": { textWrap: "wrap" },
                           }}
                        >
                           <div
                              className="content"
                              dangerouslySetInnerHTML={{
                                 __html: highlightedAnnotations,
                              }}
                           />
                        </Typography>
                     </Stack>
                     <Divider sx={{ mb: "10px" }} />
                  </>
               )}
               <CardContent>
                  <QueryResult
                     modelPath={modelPath}
                     sourceName={sourceName}
                     queryName={queryName}
                  />
               </CardContent>
            </Collapse>
         </StyledCard>
      </>
   );
}

function getQueryResultCodeSnippet(
   sourceName: string,
   queryName: string,
): string {
   return `<QueryResult
sourceName="${sourceName}"
queryName="${queryName}"
/>`;
}
