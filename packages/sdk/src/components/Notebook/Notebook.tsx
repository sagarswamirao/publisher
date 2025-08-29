import "@malloydata/malloy-explorer/styles.css";
import { Stack, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { CompiledNotebook, Configuration, NotebooksApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

import { Loading } from "../Loading";
import { usePackage } from "../Package/PackageProvider";
import {
   CleanNotebookContainer,
   CleanNotebookHeader,
   CleanNotebookSection,
} from "../styles";
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

// Helper function to get human-readable notebook name
function getNotebookDisplayName(notebookPath: string): string {
   // Extract the filename from the path
   const filename = notebookPath.split("/").pop() || notebookPath;
   // Remove the .malloynb extension
   const nameWithoutExtension = filename.replace(/\.malloynb$/, "");
   // Split by hyphens and underscores, then capitalize each word
   return nameWithoutExtension
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
}

// Requires PackageProvider
export default function Notebook({
   notebookPath,
   hideResultIcons,
   hideEmbeddingIcons,
}: NotebookProps) {
   const { projectName, packageName, versionId } = usePackage();

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
      <CleanNotebookContainer>
         <CleanNotebookSection>
            <Stack spacing={3} component="section">
               {!isSuccess && !isError && (
                  <Loading text="Fetching Notebook..." />
               )}
               {isSuccess &&
                  notebook.notebookCells?.map((cell, index) => (
                     <NotebookCell
                        cell={cell}
                        notebookPath={notebookPath}
                        hideCodeCellIcon={hideResultIcons}
                        hideEmbeddingIcon={hideEmbeddingIcons}
                        key={index}
                     />
                  ))}
               {isError && error.status === 404 && (
                  <Typography variant="body2" sx={{ color: "#666666" }}>
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
         </CleanNotebookSection>
      </CleanNotebookContainer>
   );
}
