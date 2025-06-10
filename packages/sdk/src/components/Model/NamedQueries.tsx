import {
   Typography,
   Accordion,
   AccordionSummary,
   AccordionDetails,
} from "@mui/material";
import { Box } from "@mui/system";
import { Query, QueryresultsApi } from "../../client/api";
import { StyledCard, StyledCardContent } from "../styles";

import { QueryClient, useMutation } from "@tanstack/react-query";
import { Configuration } from "../../client";
import { usePublisherPackage } from "../Package";
import React from "react";
import ResultContainer from "../RenderedResult/ResultContainer";

const queryResultsApi = new QueryresultsApi(new Configuration());
const queryClient = new QueryClient();

interface NamedQueryProps {
   modelPath: string;
   namedQueries: Array<Query>;
}

export default function NamedQueries({
   namedQueries,
   modelPath,
}: NamedQueryProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePublisherPackage();
   const [namedQueryResults, setNamedQueryResults] = React.useState<
      Record<string, string>
   >({});
   const [expandedAccordions, setExpandedAccordions] = React.useState<
      Record<string, boolean>
   >({});

   const mutation = useMutation(
      {
         mutationFn: ({ query }: { query: Query }) => {
            const val = queryResultsApi.executeQuery(
               projectName,
               packageName,
               modelPath,
               undefined,
               undefined,
               query.name,
               versionId,
               {
                  baseURL: server,
                  withCredentials: !accessToken,
                  headers: {
                     Authorization: accessToken && `Bearer ${accessToken}`,
                  },
               },
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
      },
      queryClient,
   );

   const handleAccordionChange =
      (query: Query, queryKey: string) =>
      (event: React.SyntheticEvent, isExpanded: boolean) => {
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
            {namedQueries.map((query: any, idx: number) => {
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
