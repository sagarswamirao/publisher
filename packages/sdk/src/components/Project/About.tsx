import { Divider, Typography } from "@mui/material";
import { Configuration, ProjectsApi } from "../../client";
import Markdown from "markdown-to-jsx";
import { StyledCard, StyledCardContent, StyledCardMedia } from "../styles";
import { useProject } from "./Project";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const projectsApi = new ProjectsApi(new Configuration());

export default function About() {
   const { projectName } = useProject();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["about", projectName],
      queryFn: (config) => projectsApi.getProject(projectName, false, config),
   });

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
