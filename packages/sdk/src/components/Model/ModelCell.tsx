import { Box, Typography, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import React, { useEffect } from "react";
import { Configuration, QueryresultsApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { highlight } from "../highlighter";
import { usePackage } from "../Package";
import ResultContainer from "../RenderedResult/ResultContainer";
import ResultsDialog from "../ResultsDialog";
import { CleanMetricCard, CleanNotebookCell } from "../styles";

interface ModelCellProps {
   modelPath: string;
   sourceName?: string;
   queryName: string;
   noView?: boolean;
   annotations?: string[];
}

export function ModelCell({
   modelPath,
   queryName,
   annotations,
}: ModelCellProps) {
   const [highlightedAnnotations, setHighlightedAnnotations] =
      React.useState<string>();
   const [resultsDialogOpen, setResultsDialogOpen] = React.useState(false);

   const { packageName, projectName } = usePackage();

   const queryResultsApi = new QueryresultsApi(new Configuration());

   const {
      data: queryData,
      isSuccess,
      isLoading,
   } = useQueryWithApiError({
      queryKey: [
         "namedQueryResult",
         projectName,
         packageName,
         modelPath,
         queryName,
      ],
      queryFn: (config) =>
         queryResultsApi.executeQuery(
            projectName,
            packageName,
            modelPath,
            undefined, // query
            undefined, // sourceName
            queryName, // queryName
            undefined, // versionId
            config,
         ),
      enabled: true, // Always execute
   });

   useEffect(() => {
      if (annotations && annotations.length > 0) {
         const code = annotations
            .map((annotation) => `// ${annotation}`)
            .join("\n");
         highlight(code, "typescript").then((highlightedCode) => {
            setHighlightedAnnotations(highlightedCode);
         });
      }
   }, [annotations]);

   return (
      <CleanNotebookCell>
         {highlightedAnnotations && (
            <Box sx={{ marginBottom: "16px" }}>
               <Typography
                  fontSize="12px"
                  sx={{
                     fontSize: "12px",
                     "& .line": { textWrap: "wrap" },
                  }}
               >
                  <div
                     className="content"
                     dangerouslySetInnerHTML={{
                        __html: highlightedAnnotations,
                     }}
                  />
               </Typography>
            </Box>
         )}

         {/* Query name and magnifying glass - styled like explorer tabs */}
         <Box
            sx={{
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               marginBottom: "8px",
            }}
         >
            <Typography
               variant="body2"
               sx={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#495057",
                  padding: "8px 16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
               }}
            >
               {queryName}
            </Typography>
            <IconButton
               sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  "&:hover": {
                     backgroundColor: "rgba(255, 255, 255, 1)",
                  },
                  width: "32px",
                  height: "32px",
               }}
               onClick={() => setResultsDialogOpen(true)}
            >
               <SearchIcon sx={{ fontSize: "18px", color: "#666666" }} />
            </IconButton>
         </Box>

         <CleanMetricCard
            sx={{
               position: "relative",
            }}
         >
            {isLoading && (
               <Box sx={{ padding: "20px", textAlign: "center" }}>
                  <Typography>Loading results...</Typography>
               </Box>
            )}
            {isSuccess && queryData?.data?.result && (
               <ResultContainer
                  result={queryData.data.result}
                  minHeight={300}
                  maxHeight={600}
                  hideToggle={false}
               />
            )}
         </CleanMetricCard>

         {/* Results Dialog */}
         <ResultsDialog
            open={resultsDialogOpen}
            onClose={() => setResultsDialogOpen(false)}
            result={queryData?.data?.result || ""}
            title={`Query: ${queryName}`}
         />
      </CleanNotebookCell>
   );
}
