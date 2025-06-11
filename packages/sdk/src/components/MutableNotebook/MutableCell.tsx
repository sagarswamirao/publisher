import React, { useState } from "react";
import { Suspense, lazy } from "react";
import {
   Stack,
   Collapse,
   CardActions,
   CardContent,
   IconButton,
   Tooltip,
   Button,
   Box,
   DialogContent,
   Dialog,
   DialogActions,
   DialogTitle,
} from "@mui/material";
import { StyledCard } from "../styles";
import Markdown from "markdown-to-jsx";
import { Typography } from "@mui/material";
import { Divider } from "@mui/material";
import { highlight } from "../highlighter";
import { useEffect } from "react";
import CodeIcon from "@mui/icons-material/Code";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import MDEditor from "@uiw/react-md-editor";
import { EditableMalloyCell } from "./EditableMalloyCell";
import { NotebookCellValue } from "../NotebookManager";
import { SourceAndPath } from "../Model/SourcesExplorer";
const RenderedResult = lazy(() => import("../RenderedResult/RenderedResult"));

interface NotebookCellProps {
   cell: NotebookCellValue;
   expandCodeCell?: boolean;
   expandEmbedding?: boolean;
   editingMalloy?: boolean;
   editingMarkdown?: boolean;
   sourceAndPaths: SourceAndPath[];
   newCell: React.ReactNode;
   onCellChange: (cell: NotebookCellValue) => void;
   onClose: () => void;
   onEdit: () => void;
   onDelete: () => void;
}

export function MutableCell({
   cell,
   expandCodeCell,
   expandEmbedding,
   editingMalloy,
   editingMarkdown,
   sourceAndPaths,
   newCell,
   onCellChange,
   onClose,
   onEdit,
   onDelete,
}: NotebookCellProps) {
   const [codeExpanded, setCodeExpanded] =
      React.useState<boolean>(expandCodeCell);
   const [embeddingExpanded, setEmbeddingExpanded] =
      React.useState<boolean>(expandEmbedding);
   const [highlightedMalloyCode, setHighlightedMalloyCode] =
      React.useState<string>();
   const [highlightedEmbedCode, setHighlightedEmbedCode] =
      React.useState<string>();

   useEffect(() => {
      if (!cell.isMarkdown)
         highlight(cell.value, "malloy").then((code) => {
            setHighlightedMalloyCode(code);
         });
   }, [cell]);
   const [value, setValue] = useState(cell.value);
   React.useEffect(() => {
      document.documentElement.setAttribute("data-color-mode", "light");
   });
   const updateMarkdown = useDebounce((newValue: string) => {
      onCellChange({ ...cell, value: newValue });
   });
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

   const handleDeleteConfirm = () => {
      onDelete();
      setDeleteDialogOpen(false);
   };
   const noSources = sourceAndPaths.length === 0;

   const deleteButton = (
      <Tooltip title="Delete Cell">
         <IconButton size="small" onClick={() => setDeleteDialogOpen(true)}>
            <svg
               width="20"
               height="20"
               viewBox="0 0 24 24"
               fill="none"
               xmlns="http://www.w3.org/2000/svg"
            >
               <path
                  d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>
         </IconButton>
      </Tooltip>
   );

   const deleteDialog = (
      <Dialog
         open={deleteDialogOpen}
         onClose={() => setDeleteDialogOpen(false)}
      >
         <DialogTitle>Confirm Delete</DialogTitle>
         <DialogContent>
            <Typography>Are you sure you want to delete this cell?</Typography>
         </DialogContent>
         <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error">
               Delete
            </Button>
         </DialogActions>
      </Dialog>
   );
   const buttons = cell.isMarkdown ? (
      <>
         {deleteButton}
         {(editingMarkdown && (
            <Button variant="outlined" size="small" onClick={onClose}>
               Save
            </Button>
         )) || (
            <Button variant="outlined" size="small" onClick={onEdit}>
               Edit
            </Button>
         )}
         {newCell}
      </>
   ) : (
      <>
         {!editingMalloy && (
            <Tooltip title={codeExpanded ? "Hide Code" : "View Code"}>
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
         {!editingMalloy && cell.result && (
            <Tooltip
               title={embeddingExpanded ? "Hide Embedding" : "View Embedding"}
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
         {deleteButton}

         {!editingMalloy && (
            <Button variant="outlined" size="small" onClick={onEdit}>
               Edit
            </Button>
         )}
         {newCell}
      </>
   );
   const buttonStack = (
      <>
         <Stack sx={{ flexDirection: "row", justifyContent: "right" }}>
            <CardActions
               sx={{
                  padding: "4px",
                  mb: "auto",
                  mt: "auto",
               }}
            >
               {buttons}
            </CardActions>
         </Stack>
         <Box
            sx={{
               borderBottom: "1px solid #e0e0e0",
               mx: "10px",
               width: "auto",
            }}
         />
      </>
   );
   return (
      <StyledCard variant="outlined" sx={{ marginTop: "10px" }}>
         {(cell.isMarkdown && (
            // <StyledCard variant="outlined" sx={{ border: 0 }}>
            <>
               {buttonStack}
               {editingMarkdown && (
                  <MDEditor
                     value={value}
                     preview="edit"
                     onChange={(newValue) => {
                        setValue(newValue);
                        updateMarkdown(newValue);
                     }}
                  />
               )}
               <Box
                  sx={{
                     px: 0.5,
                     pt: 0,
                     mt: 0,
                     "& h1, & h2, & h3, & h4, & h5, & h6": { mt: 0.5, mb: 0.5 },
                     "& p": { mt: 0.5, mb: 0.5 },
                     "& ul, & ol": { mt: 0.5, mb: 0.5 },
                     "& li": { mt: 0, mb: 0 },
                     "& pre, & code": { mt: 0.5, mb: 0.5 },
                     "& blockquote": { mt: 0.5, mb: 0.5 },
                  }}
               >
                  <Markdown>{value}</Markdown>
               </Box>
            </>
         )) ||
            (!cell.isMarkdown && (
               <>
                  {buttonStack}
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
                           sx={{
                              fontSize: "12px",
                              "& .line": { textWrap: "wrap" },
                           }}
                           dangerouslySetInnerHTML={{
                              __html: highlightedMalloyCode,
                           }}
                        />
                     </Stack>
                  </Collapse>
                  {editingMalloy &&
                     (noSources ? (
                        <Typography>
                           No Model Imports. Please add a model import above.
                        </Typography>
                     ) : (
                        <EditableMalloyCell
                           sourceAndPaths={sourceAndPaths}
                           onCellChange={onCellChange}
                           onClose={onClose}
                           cell={cell}
                        />
                     ))}
                  {!editingMalloy && cell.result && (
                     <>
                        <CardContent
                           sx={{ maxHeight: "400px", overflow: "auto" }}
                        >
                           <Suspense fallback="Loading malloy...">
                              <RenderedResult result={cell.result} />
                           </Suspense>
                        </CardContent>
                     </>
                  )}
               </>
            ))}
         {deleteDialogOpen && deleteDialog}
      </StyledCard>
   );
}

function useDebounce<T>(callback: (value: T) => void, delay: number = 2000) {
   const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

   return React.useCallback(
      (value: T) => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = setTimeout(() => {
            callback(value);
         }, delay);
      },
      [callback, delay],
   );
}
