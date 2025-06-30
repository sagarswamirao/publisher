import "@malloydata/malloy-explorer/styles.css";
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
import React, { useEffect } from "react";
import { CompiledNotebook, Configuration, NotebooksApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { highlight } from "../highlighter";
import { Loading } from "../Loading";
import { usePackage } from "../Package/PackageProvider";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { NotebookCell } from "./NotebookCell";

const notebooksApi = new NotebooksApi(new Configuration());

interface NotebookProps {
   notebookPath: string;
   versionId?: string;
   expandResults?: boolean;
   hideResultIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
}

// Requires PackageProvider
export default function Notebook({
   notebookPath,
   expandResults,
   hideResultIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
}: NotebookProps) {
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(false);
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();
   const { projectName, packageName, versionId } = usePackage();
   const notebookCodeSnippet = getNotebookCodeSnippet(notebookPath, true);

   useEffect(() => {
      highlight(notebookCodeSnippet, "typescript").then((code) => {
         setHighlightedEmbedCode(code);
      });
   }, [embeddingExpanded, notebookCodeSnippet]);

   const {
      data: notebook,
      isSuccess,
      isError,
      error,
   } = useQueryWithApiError<CompiledNotebook>({
      queryKey: ["notebook", projectName, packageName, notebookPath, versionId],
      queryFn: async (config) => {
         const response = await notebooksApi.getNotebook(
            projectName,
            packageName,
            notebookPath,
            versionId,
            config,
         );
         return response.data;
      },
   });

   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
               }}
            >
               <Typography variant="overline" fontWeight="bold">
                  Notebook
               </Typography>
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
               <Stack
                  sx={{
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
                           navigator.clipboard.writeText(notebookCodeSnippet);
                        }}
                     >
                        <ContentCopyIcon />
                     </IconButton>
                  </Tooltip>
               </Stack>
            </Collapse>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack spacing={2} component="section">
               {!isSuccess && !isError && (
                  <Loading text="Fetching Notebook..." />
               )}
               {isSuccess &&
                  notebook.notebookCells?.map((cell, index) => (
                     <NotebookCell
                        cell={cell}
                        notebookPath={notebookPath}
                        expandCodeCell={expandResults}
                        hideCodeCellIcon={hideResultIcons}
                        expandEmbedding={expandEmbeddings}
                        hideEmbeddingIcon={hideEmbeddingIcons}
                        key={index}
                     />
                  ))}
               {isError && error.status === 404 && (
                  <Typography variant="body2">
                     <code>{`${projectName} > ${packageName} > ${notebookPath}`}</code>{" "}
                     not found.
                  </Typography>
               )}

               {isError && error.status !== 404 && (
                  <ApiErrorDisplay
                     error={error}
                     context={`${projectName} > ${packageName} > ${notebookPath}`}
                  />
               )}
            </Stack>
         </StyledCardMedia>
      </StyledCard>
   );
}

function getNotebookCodeSnippet(
   notebookPath: string,
   expandedCodeCells: boolean,
): string {
   return `<Notebook
   notebookPath="${notebookPath}"
   expandCodeCells={${expandedCodeCells}}
/>`;
}
