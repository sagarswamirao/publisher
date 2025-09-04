import "@malloydata/malloy-explorer/styles.css";
import { Stack, Typography } from "@mui/material";
import { CompiledNotebook, Configuration, NotebooksApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

import { Loading } from "../Loading";
import { CleanNotebookContainer, CleanNotebookSection } from "../styles";
import { NotebookCell } from "./NotebookCell";
import { parseResourceUri } from "../../utils/formatting";

const notebooksApi = new NotebooksApi(new Configuration());

interface NotebookProps {
   notebookPath: string;
   resourceUri: string;
}

// Requires PackageProvider
export default function Notebook({ notebookPath, resourceUri }: NotebookProps) {
   const {
      project: projectName,
      package: packageName,
      version: versionId,
   } = parseResourceUri(resourceUri);
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
                        key={index}
                        resourceUri={resourceUri}
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
