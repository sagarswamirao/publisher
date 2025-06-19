import { Grid, Typography } from "@mui/material";
import { ProjectsApi, Configuration } from "../../client";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const projectsApi = new ProjectsApi(new Configuration());

interface HomeProps {
   navigate?: (to: string, event?: React.MouseEvent) => void;
}

export default function Home({ navigate }: HomeProps) {
   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["projects"],
      queryFn: (config) => projectsApi.listProjects(config),
   });

   if (isError) {
      return <ApiErrorDisplay error={error} context="Projects List" />;
   }

   if (isSuccess) {
      if (data.data.length === 0) {
         return <Typography variant="h4">No projects found</Typography>;
      } else if (data.data.length === 1) {
         navigate(`/${data.data[0].name}/`);
         return <></>;
      } else {
         return (
            <Grid
               container
               spacing={2}
               columns={12}
               sx={{ mb: (theme) => theme.spacing(2) }}
            >
               {data.data.map((project) => (
                  <Grid key={project.name}>
                     <Typography
                        variant="h1"
                        onClick={(event) =>
                           navigate(`/${project.name}/`, event)
                        }
                     >
                        {project.name}
                     </Typography>
                  </Grid>
               ))}
            </Grid>
         );
      }
   } else {
      return <Loading text="Loading projects..." />;
   }
}
