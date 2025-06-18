import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import {
   Box,
   Divider,
   List,
   ListItem,
   ListItemText,
   Typography,
} from "@mui/material";
import { Configuration, PackagesApi } from "../../client";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { StyledCard, StyledCardContent } from "../styles";
import { usePackage } from "./PackageProvider";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const packagesApi = new PackagesApi(new Configuration());

export default function Config() {
   const { projectName, packageName, versionId } = usePackage();

   const { data, isSuccess, isError, error } = useQueryWithApiError({
      queryKey: ["package", projectName, packageName, versionId],
      queryFn: (config) =>
         packagesApi.getPackage(
            projectName,
            packageName,
            versionId,
            false,
            config,
         ),
   });

   return (
      <StyledCard variant="outlined" sx={{ padding: "10px", width: "100%" }}>
         <StyledCardContent>
            <Typography variant="overline" fontWeight="bold">
               Package Config
            </Typography>
            <Divider />
            <Box
               sx={{
                  mt: "10px",
                  maxHeight: "200px",
                  overflowY: "auto",
               }}
            >
               <List dense={true} disablePadding={true}>
                  <ListItem dense={true} disablePadding={true}>
                     <ListItemText primary="Name" secondary={packageName} />
                  </ListItem>
                  {!isSuccess && !isError && (
                     <ListItem>
                        <Loading text="Fetching Package Metadata..." />
                     </ListItem>
                  )}
                  {isSuccess &&
                     ((data.data && (
                        <ListItem dense={true} disablePadding={true}>
                           <ListItemText
                              primary="Description"
                              secondary={data.data.description}
                           />
                        </ListItem>
                     )) || (
                        <ListItem
                           disablePadding={true}
                           dense={true}
                           sx={{ mt: "20px" }}
                        >
                           <ErrorIcon
                              sx={{
                                 color: "grey.600",
                                 mr: "10px",
                              }}
                           />
                           <ListItemText primary={"No package manifest"} />
                        </ListItem>
                     ))}
                  {isError && (
                     <ApiErrorDisplay
                        error={error}
                        context={`${projectName} > ${packageName} > ${versionId}`}
                     />
                  )}
               </List>
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
