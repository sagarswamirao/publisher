import {
   Accordion,
   AccordionDetails,
   AccordionSummary,
   Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { Query, QueryresultsApi } from "../../client/api";
import { StyledCard, StyledCardContent } from "../styles";

import React from "react";
import { Configuration } from "../../client";
import { usePackage } from "../Package";
import ResultContainer from "../RenderedResult/ResultContainer";
import { useMutationWithApiError } from "../../hooks/useQueryWithApiError";

const queryResultsApi = new QueryresultsApi(new Configuration());

interface NamedQueryProps {
   modelPath: string;
   namedQueries: Array<Query>;
}

export default function NamedQueries({
   namedQueries,
   modelPath,
}: NamedQueryProps) {
   const { projectName, packageName, versionId } = usePackage();
   const [namedQueryResults, setNamedQueryResults] = React.useState<
      Record<string, string>
   >({});
   const [expandedAccordions, setExpandedAccordions] = React.useState<
      Record<string, boolean>
   >({});

   const mutation = useMutationWithApiError({
      mutationFn: ({ query }: { query: Query }, config) => {
         const val = queryResultsApi.executeQuery(
            projectName,
            packageName,
            modelPath,
            undefined,
            undefined,
            query.name,
            versionId,
            config,
         );
         return val;
      },
      onSuccess: (data, { query }: { query: Query }) => {
         if (data) {
            setNamedQueryResults((prev) => ({
               ...prev,
               [query.name]: data.data.result,
            }));
         }
      },
   });

   const handleAccordionChange =
      (query: Query, queryKey: string) =>
      (_event: React.SyntheticEvent, isExpanded: boolean) => {
         setExpandedAccordions((prev) => ({
            ...prev,
            [queryKey]: isExpanded,
         }));

         // Trigger mutation only if expanding and we haven't executed this query before
         if (isExpanded && !namedQueryResults[query.name]) {
            mutation.mutate({ query });
         }
      };

   if (!namedQueries) {
      return <div> Loading Named Queries</div>;
   }
   if (namedQueries.length == 0) {
      return <div> No Named Queries</div>;
   }

   return (
      <StyledCard variant="outlined">
         <StyledCardContent>
            <Typography variant="subtitle1">Named Queries</Typography>
         </StyledCardContent>
         <Box>
            {namedQueries.map((query: Query, idx: number) => {
               const queryKey = query.name || `query-${idx}`;
               return (
                  <Accordion
                     key={queryKey}
                     expanded={expandedAccordions[queryKey] || false}
                     onChange={handleAccordionChange(query, queryKey)}
                  >
                     <AccordionSummary>
                        <Typography variant="body1">
                           {query.name || `Query ${idx + 1}`}
                        </Typography>
                     </AccordionSummary>
                     <AccordionDetails>
                        {mutation.isPending && expandedAccordions[queryKey] && (
                           <div
                              style={{
                                 marginTop: "10px",
                                 fontStyle: "italic",
                              }}
                           >
                              Executing query...
                           </div>
                        )}
                        <ResultContainer
                           result={namedQueryResults[query.name]}
                           minHeight={300}
                           maxHeight={900}
                        />
                        {Array.isArray(query.annotations) &&
                           query.annotations.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                 >
                                    Annotations:
                                 </Typography>
                                 <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {query.annotations.map(
                                       (annotation: string, aidx: number) => (
                                          <li key={aidx}>
                                             <Typography variant="caption">
                                                {annotation}
                                             </Typography>
                                          </li>
                                       ),
                                    )}
                                 </ul>
                              </Box>
                           )}
                     </AccordionDetails>
                  </Accordion>
               );
            })}
         </Box>
      </StyledCard>
   );
}
