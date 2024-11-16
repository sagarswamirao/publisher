import { Box, Typography, Stack } from "@mui/material";
import { Configuration, ModelsApi } from "../../client";
import axios from "axios";
import { ModelCell } from "./ModelCell";
import { StyledCard, StyledCardContent } from "../styles";
import { QueryClient, useQuery } from "@tanstack/react-query";

axios.defaults.baseURL = "http://localhost:4000";
const modelsApi = new ModelsApi(new Configuration());
const queryClient = new QueryClient();

interface ModelProps {
   server?: string;
   packageName: string;
   modelPath: string;
   versionId?: string;
}

export default function Model({
   server,
   packageName,
   modelPath,
   versionId,
}: ModelProps) {
   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["package", server, packageName, versionId],
         queryFn: () =>
            modelsApi.getModel(packageName, modelPath, versionId, {
               baseURL: server,
               withCredentials: true,
            }),
      },
      queryClient,
   );

   return (
      <>
         {!isSuccess && !isError && (
            <Typography sx={{ p: "20px", m: "auto" }}>
               Fetching Model...
            </Typography>
         )}
         {isSuccess && (
            <Stack spacing={2} component="section">
               {data.data.sources?.map((source) => (
                  <StyledCard
                     key={source.name}
                     variant="outlined"
                     sx={{ padding: "0px 10px 0px 10px" }}
                  >
                     <StyledCardContent sx={{ p: "10px" }}>
                        <Typography variant="subtitle1">
                           {"Source > " + source.name}
                        </Typography>
                        <Typography variant="body2">
                           {source.description}
                        </Typography>
                     </StyledCardContent>
                     <Stack spacing={1} component="section">
                        {source.views &&
                           source.views.length > 0 &&
                           source.views.map((view) => (
                              <ModelCell
                                 key={`${source.name}-${view.name}`}
                                 server={server}
                                 packageName={packageName}
                                 modelPath={modelPath}
                                 sourceName={source.name}
                                 queryName={view.name}
                              />
                           ))}
                     </Stack>
                     <Box height="10px" />
                  </StyledCard>
               ))}
               {data.data.queries?.length > 0 && (
                  <StyledCard
                     variant="outlined"
                     sx={{ padding: "0px 10px 0px 10px" }}
                  >
                     <StyledCardContent sx={{ p: "10px" }}>
                        <Typography variant="subtitle1">
                           Named Queries
                        </Typography>
                     </StyledCardContent>
                     <Stack spacing={1} component="section">
                        {data.data.queries.map((query) => (
                           <ModelCell
                              key={query.name}
                              server={server}
                              packageName={packageName}
                              modelPath={modelPath}
                              queryName={query.name}
                           />
                        ))}
                     </Stack>
                     <Box height="10px" />
                  </StyledCard>
               )}
            </Stack>
         )}
         {isError && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               {`${packageName} > ${modelPath} > ${versionId} - ${error.message}`}
            </Typography>
         )}
      </>
   );
}
