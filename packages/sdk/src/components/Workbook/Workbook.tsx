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
import { WorkbookManager } from "./WorkbookManager";
import { usePackage } from "../Package";
import { useServer } from "../ServerProvider";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { MutableCell } from "./MutableCell";
import { useWorkbookStorage } from "./WorkbookStorageProvider";

import * as Malloy from "@malloydata/malloy-interfaces";
import { ModelPicker } from "./ModelPicker";
import { getAxiosConfig } from "../../hooks";

const modelsApi = new ModelsApi(new Configuration());

interface WorkbookProps {
   workbookPath?: string;
   expandCodeCells?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
}

interface PathToSources {
   modelPath: string;
   sourceInfos: Malloy.SourceInfo[];
}

export default function Workbook({
   workbookPath,
   expandCodeCells,
   expandEmbeddings,
   hideEmbeddingIcons,
}: WorkbookProps) {
   const navigate = useRouterClickHandler();
   const { projectName, packageName, versionId } = usePackage();
   const { server, getAccessToken } = useServer();
   const { workbookStorage, userContext } = useWorkbookStorage();
   if (!projectName || !packageName) {
      throw new Error(
         "Project and package must be provided via PubliserPackageProvider",
      );
   }
   if (!workbookStorage || !userContext) {
      throw new Error(
         "Workbook storage and user context must be provided via WorkbookStorageProvider",
      );
   }
   const [workbookData, setWorkbookData] = React.useState<
      WorkbookManager | undefined
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
   const handleMenuClose = () => {
      setMenuAnchorEl(null);
      setMenuIndex(null);
   };
   const handleAddCell = (isMarkdown: boolean, index: number) => {
      workbookData.insertCell(index, {
         isMarkdown,
         value: "",
      });
      saveWorkbook();
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
      if (workbookPath && workbookStorage && userContext) {
         workbookStorage.deleteWorkbook(userContext, workbookPath);
      }
      setDeleteDialogOpen(false);
      navigate(`/${projectName}/${packageName}`, event);
   };

   const handleDeleteCancel = () => {
      setDeleteDialogOpen(false);
   };

   const saveWorkbook = React.useCallback(() => {
      setWorkbookData(workbookData.saveWorkbook());
   }, [workbookData]);
   React.useEffect(() => {
      // Load SourceInfos from selected models and sync PathsToSources
      if (!workbookData) {
         return;
      }

      const fetchModels = async () => {
         const modelPathToSourceInfo = new Map(
            sourceAndPaths.map(({ modelPath, sourceInfos }) => [
               modelPath,
               sourceInfos,
            ]),
         );
         const newSourceAndPaths = [];
         const promises = [];

         for (const model of workbookData.getModels()) {
            if (!modelPathToSourceInfo.has(model)) {
               console.log("Fetching model from Publisher", model);
               promises.push(
                  modelsApi
                     .getModel(
                        projectName,
                        packageName,
                        model,
                        versionId,
                        await getAxiosConfig(server, getAccessToken),
                     )
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
            const loadedSourceAndPaths = await Promise.all(promises);
            setSourceAndPaths([...newSourceAndPaths, ...loadedSourceAndPaths]);
         } else {
            setSourceAndPaths(newSourceAndPaths);
         }
      };

      fetchModels();
   }, [
      // Work this cannot depend on sourceAndPaths because it will cause an infinite loop.
      getAccessToken,
      workbookData,
      packageName,
      projectName,
      server,
      versionId,
   ]);

   React.useEffect(() => {
      if (!workbookPath) {
         return;
      }
      setWorkbookData(
         WorkbookManager.loadWorkbook(
            workbookStorage,
            userContext,
            workbookPath,
         ),
      );
   }, [workbookPath, workbookStorage, userContext]);

   if (!workbookData) {
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
   const plusButton = (isMarkdown: boolean, index: number) => {
      return (
         <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleAddCell(isMarkdown, index)}
            variant="contained"
            sx={{
               backgroundColor: "#fff",
               color: (theme) =>
                  theme.palette.mode === "dark"
                     ? theme.palette.grey[100]
                     : theme.palette.grey[700],
               boxShadow: "none",
               "&:hover": {
                  backgroundColor: (theme) =>
                     theme.palette.mode === "dark"
                        ? theme.palette.grey[500]
                        : theme.palette.grey[300],
                  boxShadow: "none",
               },
            }}
         >
            {isMarkdown ? "Markdown" : "Explore"}
         </Button>
      );
   };
   const addButtonSet = (
      <Box
         sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            flex: 2,
         }}
      >
         {plusButton(false, workbookData.getCells().length)}
         {plusButton(true, workbookData.getCells().length)}
      </Box>
   );

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
                     {`${projectName} > ${packageName} > ${workbookPath}`}
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
                     <ExportMalloyButton workbookData={workbookData} />
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
                        <DialogTitle>Delete Workbook</DialogTitle>
                        <DialogContent>
                           <DialogContentText>
                              Are you sure you want to delete the workbook
                              &quot;
                              {workbookPath}&quot;? This action cannot be
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
                     initialSelectedModels={workbookData.getModels()}
                     onModelChange={(models) => {
                        setWorkbookData(workbookData.setModels(models));
                        saveWorkbook();
                     }}
                  />
               </Box>
               <Box sx={{ flex: 1 }} />
            </Stack>
         </StyledCardContent>
         <StyledCardMedia>
            <Stack>
               {workbookData.getCells().length === 0 && (
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
               {workbookData.getCells().map((cell, index) => (
                  <React.Fragment
                     key={`${index}-${workbookData.getCells().length}`}
                  >
                     <MutableCell
                        key={`${index}-${cell.isMarkdown}-${workbookPath}-${projectName}-${packageName}`}
                        cell={cell}
                        addButtonCallback={(isMarkdown) =>
                           plusButton(isMarkdown, index)
                        }
                        sourceAndPaths={getSourceList(sourceAndPaths)}
                        expandCodeCell={expandCodeCells}
                        expandEmbedding={expandEmbeddings}
                        hideEmbeddingIcons={hideEmbeddingIcons}
                        editingMarkdown={editingMarkdownIndex === index}
                        editingMalloy={editingMalloyIndex === index}
                        onDelete={() => {
                           setWorkbookData(workbookData.deleteCell(index));
                           saveWorkbook();
                        }}
                        onCellChange={(cell) => {
                           setWorkbookData(workbookData.setCell(index, cell));
                           saveWorkbook();
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
               {addButtonSet}
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
   workbookData,
}: {
   workbookData: WorkbookManager;
}) {
   const [copied, setCopied] = React.useState(false);
   const handleExport = async () => {
      if (!workbookData) return;
      const malloy = workbookData.toMalloyWorkbook();
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
