import { Divider, Typography } from "@mui/material";
import { Configuration, ProjectsApi } from "../../client";
import Markdown from "markdown-to-jsx";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useProject } from "./Project";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";

const projectsApi = new ProjectsApi(new Configuration());
const queryClient = new QueryClient();

export default function About() {
   const { server, projectName, accessToken } = useProject();

   const { data, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["about", server, projectName],
         queryFn: () =>
            projectsApi.getProject(projectName, false, {
               baseURL: server,
               withCredentials: true,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
         retry: false,
         throwOnError: false,
      },
      queryClient,
   );

   return (
      <>
         {!isSuccess && !isError && <Loading text="Fetching About..." />}
         {isSuccess && (
            <StyledCard variant="outlined">
               <StyledCardContent>
                  <Typography variant="overline" fontWeight="bold">
                     Readme
                  </Typography>
                  <Divider />
               </StyledCardContent>
               <StyledCardMedia>
                  <Markdown>{data.data.readme}</Markdown>
               </StyledCardMedia>
            </StyledCard>
         )}
         {isError && (
            <ApiErrorDisplay error={error} context={`${projectName} > About`} />
         )}
      </>
   );
}
