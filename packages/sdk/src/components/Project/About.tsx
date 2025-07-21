import { Typography } from "@mui/material";
import Markdown from "markdown-to-jsx";
import { Configuration, ProjectsApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { StyledCard } from "../styles";
import { useProject } from "./Project";

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
         {isSuccess && data.data?.readme && (
            <StyledCard variant="outlined" sx={{ p: 2 }}>
               <Typography variant="overline" fontWeight="bold" sx={{ mb: 1 }}>
                  Readme
               </Typography>
               <StyledCard sx={{ p: 1 }}>
                  <Markdown>{data.data.readme}</Markdown>
               </StyledCard>
            </StyledCard>
         )}
         {isError && (
            <ApiErrorDisplay error={error} context={`${projectName} > About`} />
         )}
      </>
   );
}
