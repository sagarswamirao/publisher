import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { useParams, NavLink } from "react-router-dom";
import { Box, IconButton, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";

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
               color={(params.packageName && "primary.main") || "text.primary"}
               component={NavLink}
               to="/"
               sx={{ textDecoration: "none" }}
               variant="subtitle1"
            >
               Home
            </Typography>
            {params.packageName && (
               <>
                  <Typography
                     color={(modelPath && "primary.main") || "text.primary"}
                     component={NavLink}
                     to={`/${params.packageName}/`}
                     sx={{ textDecoration: "none" }}
                     variant="subtitle1"
                  >
                     {params.packageName}
                  </Typography>
               </>
            )}
            {modelPath && (
               <>
                  <Typography
                     color="text.primary"
                     component={NavLink}
                     to={`/${params.packageName}/${modelPath}`}
                     sx={{ textDecoration: "none" }}
                     variant="subtitle1"
                  >
                     {modelPath}
                  </Typography>
               </>
            )}
         </Breadcrumbs>
         {(params.packageName || modelPath) && (
            <Tooltip title="View Code">
               <IconButton
                  sx={{ width: "24px", height: "24px", mt: "auto", mb: "auto" }}
               >
                  <LinkIcon
                     onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                     }}
                  />
               </IconButton>
            </Tooltip>
         )}
      </Box>
   );
}
