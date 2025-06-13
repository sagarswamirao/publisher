import { Divider, Typography } from "@mui/material";
import { Configuration, ProjectsApi } from "../../client";
import Markdown from "markdown-to-jsx";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useProject } from "./Project";

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
      },
      queryClient,
   );

   return (
      <>
         {!isSuccess && !isError && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               Fetching About...
            </Typography>
         )}
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
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               {error.message}
            </Typography>
         )}
      </>
   );
}
