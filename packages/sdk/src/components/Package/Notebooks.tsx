import { Box, Typography } from "@mui/material";
import { Configuration, NotebooksApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import {
   PackageCard,
   PackageCardContent,
   PackageSectionTitle,
} from "../styles";
import { FileTreeView } from "./FileTreeView";
import { parseResourceUri } from "../../utils/formatting";

const notebooksApi = new NotebooksApi(new Configuration());

const DEFAULT_EXPANDED_FOLDERS = ["notebooks/"];

interface NotebooksProps {
   navigate: (to: string, event?: React.MouseEvent) => void;
   resourceUri: string;
}

export default function Notebooks({ navigate, resourceUri }: NotebooksProps) {
   const {
      project: projectName,
      package: packageName,
      version: versionId,
   } = parseResourceUri(resourceUri);

   const { data, isError, error, isSuccess } = useQueryWithApiError({
      queryKey: ["notebooks", projectName, packageName, versionId],
      queryFn: (config) =>
         notebooksApi.listNotebooks(
            projectName,
            packageName,
            versionId,
            config,
         ),
   });

   return (
      <PackageCard>
         <PackageCardContent>
            <PackageSectionTitle>Notebooks</PackageSectionTitle>
            <Box
               sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
               }}
            >
               {!isSuccess && !isError && (
                  <Loading text="Fetching Notebooks..." />
               )}
               {isError && (
                  <ApiErrorDisplay
                     error={error}
                     context={`${projectName} > ${packageName} > Notebooks`}
                  />
               )}
               {isSuccess && data.data.length > 0 && (
                  <FileTreeView
                     items={data.data.sort((a, b) => {
                        return a.path.localeCompare(b.path);
                     })}
                     defaultExpandedItems={DEFAULT_EXPANDED_FOLDERS}
                     navigate={navigate}
                  />
               )}
               {isSuccess && data.data.length === 0 && (
                  <Typography variant="body2">No notebooks found</Typography>
               )}
            </Box>
         </PackageCardContent>
      </PackageCard>
   );
}
