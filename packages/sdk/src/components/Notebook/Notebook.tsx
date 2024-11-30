import { Configuration, ModelsApi } from "../../client";
import axios from "axios";
import Stack from "@mui/material/Stack";
import { NotebookCell } from "./NotebookCell";
import { Typography } from "@mui/material";
import { useQuery, QueryClient } from "@tanstack/react-query";

axios.defaults.baseURL = "http://localhost:4000";
const modelsApi = new ModelsApi(new Configuration());
const queryClient = new QueryClient();

interface NotebookProps {
   server?: string;
   packageName: string;
   notebookPath: string;
   versionId?: string;
   expandCodeCells?: boolean;
   hideCodeCellIcons?: boolean;
   expandEmbeddings?: boolean;
   hideEmbeddingIcons?: boolean;
   accessToken?: string;
}

export default function Notebook({
   server,
   packageName,
   notebookPath,
   versionId,
   expandCodeCells,
   hideCodeCellIcons,
   expandEmbeddings,
   hideEmbeddingIcons,
   accessToken,
}: NotebookProps) {
   const {
      data: notebook,
      isSuccess,
      isError,
      error,
   } = useQuery(
      {
         queryKey: [server, packageName, notebookPath, versionId],
         queryFn: () =>
            modelsApi.getModel(packageName, notebookPath, versionId, {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
         retry: false,
      },
      queryClient,
   );

   return (
      <Stack spacing={1} component="section">
         {!isSuccess && !isError && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               Fetching Notebook...
            </Typography>
         )}
         {isSuccess &&
            notebook.data.notebookCells?.map((cell, index) => (
               <NotebookCell
                  cell={cell}
                  modelDef={notebook.data.modelDef}
                  dataStyles={notebook.data.dataStyles}
                  queryResultCodeSnippet={getQueryResultCodeSnippet(
                     server,
                     packageName,
                     notebookPath,
                     cell.text,
                  )}
                  expandCodeCell={expandCodeCells}
                  hideCodeCellIcon={hideCodeCellIcons}
                  expandEmbedding={expandEmbeddings}
                  hideEmbeddingIcon={hideEmbeddingIcons}
                  key={index}
               />
            ))}
         {isError && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               {(error.message.includes("404") &&
                  `${notebookPath} does not exist`) ||
                  `${packageName} > ${notebookPath} > ${versionId} - ${error.message}`}
            </Typography>
         )}
      </Stack>
   );
}

function getQueryResultCodeSnippet(
   server: string,
   packageName: string,
   modelPath: string,
   query: string,
): string {
   const queryResultsString = `<QueryResult server="${server}" accessToken={accessToken} packageName="${packageName}" modelPath="${modelPath}" query="${query}"/>`;
   return queryResultsString.replace(/\n/g, "");
}
