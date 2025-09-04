import { Box } from "@mui/material";
import Markdown from "markdown-to-jsx";
import { Configuration, ProjectsApi } from "../../client";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import {
   PackageCard,
   PackageCardContent,
   PackageSectionTitle,
} from "../styles";
import { usePublisherResource } from "../Package";

const projectsApi = new ProjectsApi(new Configuration());

export default function About() {
   const { projectName } = usePublisherResource();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["about", projectName],
      queryFn: (config) => projectsApi.getProject(projectName, false, config),
   });

   return (
      <>
         {!isSuccess && !isError && <Loading text="Fetching About..." />}
         {isSuccess && data.data?.readme && (
            <PackageCard>
               <PackageCardContent>
                  <PackageSectionTitle>Readme</PackageSectionTitle>
                  <Box sx={{ mt: 1 }}>
                     <Markdown>{data.data.readme}</Markdown>
                  </Box>
               </PackageCardContent>
            </PackageCard>
         )}
         {isError && (
            <ApiErrorDisplay error={error} context={`${projectName} > About`} />
         )}
      </>
   );
}
