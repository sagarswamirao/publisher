// TODO(jjs) - Export to .malloynb
// TOOD(jjs) - Import via Publisher API that parses whole NB

import AddIcon from "@mui/icons-material/Add";
import {
   Box,
   Button,
   Dialog,
   DialogActions,
   DialogContent,
   DialogContentText,
   DialogTitle,
   Divider,
   Menu,
   MenuItem,
   Typography,
} from "@mui/material";
import Stack from "@mui/material/Stack";
import React from "react";
import { Configuration, ModelsApi } from "../../client";
import { useRouterClickHandler } from "../click_helper";
import { SourceAndPath } from "../Model/SourcesExplorer";
import { NotebookManager } from "../NotebookManager";
import { usePackage } from "../Package";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { MutableCell } from "./MutableCell";
import { useNotebookStorage } from "./NotebookStorageProvider";

import * as Malloy from "@malloydata/malloy-interfaces";
import { ModelPicker } from "./ModelPicker";

const modelsApi = new ModelsApi(new Configuration());

interface MutableNotebookProps {
   notebookPath?: string;
   expandCodeCells?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
}

interface PathToSources {
   modelPath: string;
   sourceInfos: Malloy.SourceInfo[];
}

export default function MutableNotebook({
   notebookPath,
   expandCodeCells,
   expandEmbeddings,
   hideEmbeddingIcons,
}: MutableNotebookProps) {
   const navigate = useRouterClickHandler();
   const { server, projectName, packageName, versionId, accessToken } =
      usePackage();
   if (!projectName || !packageName) {
      throw new Error(
         "Project and package must be provided via PubliserPackageProvider",
      );
   }
   const { notebookStorage, userContext } = useNotebookStorage();
   if (!notebookStorage || !userContext) {
      throw new Error(
         "Notebook storage and user context must be provided via NotebookStorageProvider",
      );
   }
   const [notebookData, setNotebookData] = React.useState<
      NotebookManager | undefined
   >();
   const [editingMalloyIndex, setEditingMalloyIndex] = React.useState<
      number | undefined
   >();
   const [editingMarkdownIndex, setEditingMarkdownIndex] = React.useState<
      number | undefined
   >();
   const [sourceAndPaths, setSourceAndPaths] = React.useState<PathToSources[]>(
      [],
   );
   const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
      null,
   );
   const [menuIndex, setMenuIndex] = React.useState<number | null>(null);
   const menuOpen = Boolean(menuAnchorEl);
   const handleMenuClick = (
      event: React.MouseEvent<HTMLButtonElement>,
      index: number,
   ) => {
      setMenuAnchorEl(event.currentTarget);
      setMenuIndex(index);
   };
   const handleMenuClose = () => {
      setMenuAnchorEl(null);
      setMenuIndex(null);
   };
   const handleAddCell = (isMarkdown: boolean, index: number) => {
      notebookData.insertCell(index, {
         isMarkdown,
         value: "",
      });
      saveNotebook();
      if (isMarkdown) {
         setEditingMarkdownIndex(index);
      } else {
         setEditingMalloyIndex(index);
      }
      handleMenuClose();
   };

   const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
   const handleDeleteClick = () => {
      setDeleteDialogOpen(true);
   };

   const handleDeleteConfirm = (event?: React.MouseEvent) => {
      if (notebookPath && notebookStorage && userContext) {
         notebookStorage.deleteNotebook(userContext, notebookPath);
      }
      setDeleteDialogOpen(false);
      navigate(`/${projectName}/${packageName}`, event);
   };

   const handleDeleteCancel = () => {
      setDeleteDialogOpen(false);
   };

   const saveNotebook = React.useCallback(() => {
      setNotebookData(notebookData.saveNotebook());
   }, [notebookData]);
   React.useEffect(() => {
      // Load SourceInfos from selected models and sync PathsToSources
      if (!notebookData) {
         return;
      }
      const modelPathToSourceInfo = new Map(
         sourceAndPaths.map(({ modelPath, sourceInfos }) => [
            modelPath,
            sourceInfos,
         ]),
      );
      const newSourceAndPaths = [];
      const promises = [];
      for (const model of notebookData.getModels()) {
         if (!modelPathToSourceInfo.has(model)) {
            console.log("Fetching model from Publisher", model);
            promises.push(
               modelsApi
                  .getModel(projectName, packageName, model, versionId, {
                     baseURL: server,
                     withCredentials: !accessToken,
                  })
                  .then((data) => ({
                     modelPath: model,
                     sourceInfos: data.data.sourceInfos.map((source) =>
                        JSON.parse(source),
                     ),
                  })),
            );
         } else {
            newSourceAndPaths.push({
               modelPath: model,
               sourceInfos: modelPathToSourceInfo.get(model),
            });
         }
      }
      if (promises.length > 0) {
         Promise.all(promises).then((loadedSourceAndPaths) => {
            setSourceAndPaths([...newSourceAndPaths, ...loadedSourceAndPaths]);
         });
      }
   }, [
      accessToken,
      notebookData,
      packageName,
      projectName,
      server,
      sourceAndPaths,
      versionId,
   ]);

   React.useEffect(() => {
      if (!notebookPath) {
         return;
      }
      setNotebookData(
         NotebookManager.loadNotebook(
            notebookStorage,
            userContext,
            notebookPath,
         ),
      );
   }, [notebookPath, notebookStorage, userContext]);

   if (!notebookData) {
      return <div>Loading...</div>;
   }
   const getSourceList = (sourceAndPaths: PathToSources[]): SourceAndPath[] => {
      const sourceAndPath = [];
      for (const sources of sourceAndPaths) {
         for (const sourceInfo of sources.sourceInfos) {
            sourceAndPath.push({
               modelPath: sources.modelPath,
               sourceInfo: sourceInfo,
            });
         }
      }
      return sourceAndPath;
   };
   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
               }}
            >
               <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                     variant="overline"
                     sx={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        verticalAlign: "middle",
                     }}
                  >
                     Workbook
                  </Typography>
                  <Typography
                     variant="subtitle2"
                     sx={{
                        fontSize: "13px",
                        fontWeight: "normal",
                        verticalAlign: "middle",
                        ml: 1,
                     }}
                  >
                     {`${projectName} > ${packageName} > ${notebookPath}`}
                  </Typography>
               </Stack>
               <Stack sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                  <Box
                     sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        mb: 1,
                     }}
                  >
                     <ExportMalloyButton notebookData={notebookData} />
                  </Box>
                  <Box
                     sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                        mb: 1,
                     }}
                  >
                     <Button
                        color="error"
                        onClick={handleDeleteClick}
                        size="small"
                     >
                        Delete
                     </Button>
                     <Dialog
                        open={deleteDialogOpen}
                        onClose={handleDeleteCancel}
                     >
                        <DialogTitle>Delete Notebook</DialogTitle>
                        <DialogContent>
                           <DialogContentText>
                              Are you sure you want to delete the notebook
                              &quot;
                              {notebookPath}&quot;? This action cannot be
                              undone.
                           </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                           <Button
                              onClick={handleDeleteCancel}
                              color="primary"
                              size="small"
                           >
                              Cancel
                           </Button>
                           <Button
                              onClick={(event) => handleDeleteConfirm(event)}
                              color="error"
                              autoFocus
                              size="small"
                           >
                              Delete
                           </Button>
                        </DialogActions>
                     </Dialog>
                  </Box>
               </Stack>
            </Stack>
            <Divider />
            <Stack
               sx={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  mt: 2,
               }}
            >
               <Box sx={{ flex: 1 }}>
                  <ModelPicker
                     initialSelectedModels={notebookData.getModels()}
                     onModelChange={(models) => {
                        setNotebookData(notebookData.setModels(models));
                        saveNotebook();
                     }}
                  />
               </Box>
               <Box
                  sx={{
                     display: "flex",
                     gap: 1,
                     justifyContent: "center",
                     flex: 2,
                  }}
               >
                  <Button
                     size="small"
                     startIcon={<AddIcon />}
                     onClick={() =>
                        handleAddCell(false, notebookData.getCells().length)
                     }
                  >
                     Explore
                  </Button>
                  <Button
                     size="small"
                     startIcon={<AddIcon />}
                     onClick={() =>
                        handleAddCell(true, notebookData.getCells().length)
                     }
                  >
                     Markdown
                  </Button>
               </Box>
               <Box sx={{ flex: 1 }} />
            </Stack>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack>
               {notebookData.getCells().length === 0 && (
                  <>
                     <Typography
                        sx={{
                           textAlign: "center",
                           p: 2,
                           variant: "subtitle2",
                           fontWeight: "medium",
                        }}
                     >
                        Workbook is empty
                     </Typography>
                     <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mb: 2, variant: "body2" }}
                     >
                        Click the + buttons to add a markdown or code cell.
                     </Typography>
                  </>
               )}
               {notebookData.getCells().map((cell, index) => (
                  <React.Fragment
                     key={`${index}-${notebookData.getCells().length}`}
                  >
                     <MutableCell
                        cell={cell}
                        sourceAndPaths={getSourceList(sourceAndPaths)}
                        expandCodeCell={expandCodeCells}
                        expandEmbedding={expandEmbeddings}
                        hideEmbeddingIcons={hideEmbeddingIcons}
                        editingMarkdown={editingMarkdownIndex === index}
                        editingMalloy={editingMalloyIndex === index}
                        onDelete={() => {
                           setNotebookData(notebookData.deleteCell(index));
                           saveNotebook();
                        }}
                        onCellChange={(cell) => {
                           setNotebookData(notebookData.setCell(index, cell));
                           saveNotebook();
                        }}
                        onEdit={() => {
                           if (cell.isMarkdown) {
                              setEditingMarkdownIndex(index);
                           } else {
                              setEditingMalloyIndex(index);
                           }
                        }}
                        onClose={() => {
                           if (cell.isMarkdown) {
                              setEditingMarkdownIndex(undefined);
                           } else {
                              setEditingMalloyIndex(undefined);
                           }
                        }}
                     />
                  </React.Fragment>
               ))}
               <Menu
                  anchorEl={menuAnchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
               >
                  <MenuItem onClick={() => handleAddCell(true, menuIndex ?? 0)}>
                     Add Markdown
                  </MenuItem>
                  <MenuItem
                     onClick={() => handleAddCell(false, menuIndex ?? 0)}
                  >
                     Add Malloy
                  </MenuItem>
               </Menu>
               <Stack
                  sx={{
                     flexDirection: "row",
                     justifyContent: "flex-end",
                     p: 1,
                  }}
               ></Stack>
            </Stack>
         </StyledCardMedia>
      </StyledCard>
   );
}

function ExportMalloyButton({
   notebookData,
}: {
   notebookData: NotebookManager;
}) {
   const [copied, setCopied] = React.useState(false);
   const handleExport = async () => {
      if (!notebookData) return;
      const malloy = notebookData.toMalloyNotebook();
      try {
         await navigator.clipboard.writeText(malloy);
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      } catch {
         setCopied(false);
         alert("Failed to copy to clipboard");
      }
   };
   return (
      <Button color="primary" onClick={handleExport} size="small">
         {copied ? "Copied!" : "Export"}
      </Button>
   );
}
