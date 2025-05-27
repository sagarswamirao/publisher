// TODO(jjs) - Export to .malloynb
// TOOD(jjs) - Import via Publisher API that parses whole NB

import React from "react";
import Stack from "@mui/material/Stack";
import {
   Box,
   Button,
   CardActions,
   TextField,
   Typography,
   Menu,
   MenuItem,
} from "@mui/material";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { MutableCell } from "./MutableCell";
import { Configuration, ModelsApi } from "../../client";
import { ModelPicker } from "./ModelPicker";
import { usePublisherPackage } from "../Package";
import { NotebookManager } from "../NotebookManager";
import { SourceAndPath } from "../Model/SourcesExplorer";
import { useNotebookStorage } from "./NotebookStorageProvider";

import * as Malloy from "@malloydata/malloy-interfaces";

const modelsApi = new ModelsApi(new Configuration());

interface MutableNotebookProps {
   inputNotebookPath: string | undefined;
   expandCodeCells?: boolean;
   expandEmbeddings?: boolean;
}

function getNotebookPath() {
   const params = new URLSearchParams(window.location.hash.substring(1));
   return params.get("notebookPath");
}
interface PathToSources {
   modelPath: string;
   sourceInfos: Malloy.SourceInfo[];
}

export default function MutableNotebook({
   inputNotebookPath,
   expandCodeCells,
   expandEmbeddings,
}: MutableNotebookProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePublisherPackage();
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
   const [notebookPath, setNotebookPath] = React.useState(inputNotebookPath);
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
      if (!notebookData) {
         setNotebookData(
            NotebookManager.loadNotebook(
               notebookStorage,
               userContext,
               getNotebookPath(),
            ),
         );
         setNotebookPath(getNotebookPath());
      }
   }, [notebookData, packageName, projectName, notebookStorage, userContext]);

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
   const createButtons = (index: number) => {
      return (
         <CardActions
            sx={{
               padding: "0px 10px 0px 10px",
               mb: "auto",
               mt: "auto",
               justifyContent: "flex-end",
            }}
         >
            <Button
               variant="outlined"
               size="small"
               startIcon={<AddIcon />}
               onClick={(e) => handleMenuClick(e, index)}
            >
               New Cell
            </Button>
         </CardActions>
      );
   };
   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Stack
               sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
               }}
            >
               <Box sx={{ display: "flex", alignItems: "top", gap: 1 }}>
                  <Typography
                     sx={{
                        fontSize: "150%",
                        minHeight: "56px",
                        fontWeight: "bold",
                     }}
                  >
                     Notebook :
                  </Typography>
                  <TextField
                     value={notebookPath}
                     onChange={(e) => {
                        setNotebookPath(e.target.value);
                     }}
                     onBlur={(e) => {
                        const url = new URL(window.location.href);
                        url.hash = `notebookPath=${e.target.value}`;
                        notebookData.renameNotebook(e.target.value);
                        window.history.pushState({}, "", url);
                     }}
                     size="medium"
                     variant="standard"
                     error={!notebookPath}
                     helperText={
                        !notebookPath
                           ? "Please enter a notebook name"
                           : undefined
                     }
                     sx={{ flex: 1 }}
                  />
               </Box>
               <Box
                  sx={{ display: "flex", alignItems: "center", mt: 1, mb: 1 }}
               >
                  <ExportMalloyButton notebookData={notebookData} />
               </Box>
            </Stack>
         </StyledCardContent>
         <ModelPicker
            initialSelectedModels={notebookData.getModels()}
            onModelChange={(models) => {
               setNotebookData(notebookData.setModels(models));
               saveNotebook();
            }}
         />

         <StyledCardMedia>
            <Stack>
               {notebookData.getCells().map((cell, index) => (
                  <React.Fragment
                     key={`${index}-${notebookData.getCells().length}`}
                  >
                     <MutableCell
                        cell={cell}
                        newCell={createButtons(index)}
                        sourceAndPaths={getSourceList(sourceAndPaths)}
                        expandCodeCell={expandCodeCells}
                        expandEmbedding={expandEmbeddings}
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
               <Box style={{ paddingRight: "7px", paddingTop: "10px" }}>
                  {createButtons(notebookData.getCells().length)}
               </Box>
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
function AddIcon() {
   return (
      <svg
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
      >
         <path
            d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"
            fill="currentColor"
         />
      </svg>
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
      <Button variant="contained" color="primary" onClick={handleExport}>
         {copied ? "Copied!" : "Export To Malloy"}
      </Button>
   );
}
