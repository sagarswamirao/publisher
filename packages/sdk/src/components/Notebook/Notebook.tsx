import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import {
   Box,
   CardActions,
   Collapse,
   Divider,
   IconButton,
   Stack,
   Tooltip,
   Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { Configuration, NotebooksApi, CompiledNotebook } from "../../client";
import { highlight } from "../highlighter";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { NotebookCell } from "./NotebookCell";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import "@malloydata/malloy-explorer/styles.css";
import { usePackage } from "../Package/PackageProvider";
import { useServer } from "../ServerProvider";
import { Loading } from "../Loading";

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
   const { server, accessToken } = useServer();
   const notebookCodeSnippet = getNotebookCodeSnippet(
      server,
      packageName,
      notebookPath,
      true,
   );

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
      queryKey: [
         "notebook",
         server,
         projectName,
         packageName,
         notebookPath,
         versionId,
      ],
      queryFn: async () => {
         const response = await notebooksApi.getNotebook(
            projectName,
            packageName,
            notebookPath,
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
                           navigator.clipboard.writeText(notebookCodeSnippet);
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
            <Stack spacing={1} component="section">
               {!isSuccess && !isError && (
                  <Loading text="Fetching Notebook..." />
               )}
               {isSuccess &&
                  notebook.notebookCells?.map((cell, index) => (
                     <NotebookCell
                        cell={cell}
                        notebookPath={notebookPath}
                        queryResultCodeSnippet={getQueryResultCodeSnippet(
                           server,
                           projectName,
                           packageName,
                           notebookPath,
                           cell.text,
                        )}
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

function getQueryResultCodeSnippet(
   server: string,
   projectName: string,
   packageName: string,
   modelPath: string,
   query: string,
): string {
   return `<QueryResult
   server="${server}"
   accessToken={accessToken}
   projectName="${projectName}"
   packageName="${packageName}"
   modelPath="${modelPath}"
   query="
      ${query}
   "
/>`;
}

function getNotebookCodeSnippet(
   server: string,
   packageName: string,
   notebookPath: string,
   expandedCodeCells: boolean,
): string {
   return `<Notebook
   server="${server}"
   packageName="${packageName}"
   notebookPath="${notebookPath}"
   versionId={versionId}
   accessToken={accessToken}
   expandCodeCells={${expandedCodeCells}}
/>`;
}
