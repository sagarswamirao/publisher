import { Box } from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { NavLink, useParams } from "react-router-dom";

export default function BreadcrumbNav() {
   const params = useParams();
   const modelPath = params["*"];
   return (
      <Box
         sx={{
            display: "inline-flex",
            flexDirection: "row",
            gap: 3,
            overflow: "auto",
         }}
      >
         <Breadcrumbs aria-label="breadcrumb">
            <Typography
               color="primary.main"
               component={NavLink}
               to={`/${params.projectName}/`}
               sx={{ textDecoration: "none" }}
               variant="subtitle1"
            >
               {params.projectName}
            </Typography>
            {params.packageName && (
               <Typography
                  color="primary.main"
                  component={NavLink}
                  to={`/${params.projectName}/${params.packageName}/`}
                  sx={{ textDecoration: "none" }}
                  variant="subtitle1"
               >
                  {params.packageName}
               </Typography>
            )}
            {modelPath && (
               <Typography
                  color="primary.main"
                  component={NavLink}
                  to={`/${params.projectName}/${params.packageName}/${modelPath}`}
                  sx={{ textDecoration: "none" }}
                  variant="subtitle1"
               >
                  {modelPath}
               </Typography>
            )}
         </Breadcrumbs>
      </Box>
   );
}
