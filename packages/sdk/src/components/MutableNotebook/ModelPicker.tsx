import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
   Button,
   Chip,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   FormControl,
   List,
   ListItem,
   ListItemButton,
   ListItemText,
   Stack,
   Typography,
} from "@mui/material";
import { QueryClient, useQuery } from "@tanstack/react-query";
import React from "react";
import { Configuration, ModelsApi } from "../../client";
import { usePackage } from "../Package/PackageProvider";
import { StyledCard } from "../styles";
import { ApiErrorDisplay } from "../ApiErrorDisplay";

const modelsApi = new ModelsApi(new Configuration());
const queryClient = new QueryClient();

interface ModelPickerProps {
   initialSelectedModels: string[];
   onModelChange: (models: string[]) => void;
}

/**
 * Picks Models that are available in the package.
 * Only "malloy" model files are shown.
 */
export function ModelPicker({
   initialSelectedModels,
   onModelChange,
}: ModelPickerProps) {
   const { server, projectName, packageName, versionId, accessToken } =
      usePackage();
   const { data, isLoading, isSuccess, isError, error } = useQuery(
      {
         queryKey: ["models", server, projectName, packageName, versionId],
         queryFn: () =>
            modelsApi.listModels(projectName, packageName, versionId, {
               baseURL: server,
               withCredentials: !accessToken,
               headers: {
                  Authorization: accessToken && `Bearer ${accessToken}`,
               },
            }),
         retry: false,
         throwOnError: false,
      },
      queryClient,
   );
   const [selectedModels, setSelectedModels] = React.useState<string[]>(
      initialSelectedModels || [],
   );
   const [addDialogOpen, setAddDialogOpen] = React.useState(false);

   React.useEffect(() => {
      setSelectedModels(initialSelectedModels || []);
   }, [initialSelectedModels]);

   const handleRemove = (model: string) => {
      const newModels = selectedModels.filter((m) => m !== model);
      setSelectedModels(newModels);
      onModelChange(newModels);
   };

   const handleAdd = (model: string) => {
      const newModels = [...selectedModels, model];
      setSelectedModels(newModels);
      onModelChange(newModels);
      setAddDialogOpen(false);
   };

   let availableModels: string[] = [];
   if (isSuccess && data?.data) {
      availableModels = data.data
         .filter((model) => !selectedModels.includes(model.path))
         .map((model) => model.path);
   }

   if (isError) {
      return (
         <ApiErrorDisplay
            error={error}
            context={`${projectName} > ${packageName} > Model Picker`}
         />
      );
   }

   return (
      <StyledCard
         sx={{ maxWidth: 400, marginLeft: "10px", padding: "10px 5px 5px 5px" }}
      >
         <Typography variant="h6">Imported Models</Typography>
         <FormControl fullWidth>
            {isLoading && <Typography>Loading...</Typography>}
            <Stack
               direction="row"
               spacing={1}
               sx={{
                  flexWrap: "wrap",
                  minHeight: 30,
                  alignItems: "center",
                  rowGap: "8px",
               }}
            >
               {selectedModels.map((model) => (
                  <Chip
                     key={model}
                     label={model}
                     onDelete={() => handleRemove(model)}
                     deleteIcon={<CloseIcon />}
                     sx={{ marginBottom: "5px" }}
                  />
               ))}
               <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  sx={{ height: 32, marginTop: "10px" }}
                  disabled={
                     isLoading || isError || availableModels.length === 0
                  }
               >
                  Add Model
               </Button>
            </Stack>
         </FormControl>
         <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
            <DialogTitle>Select a Model</DialogTitle>
            <DialogContent>
               {availableModels.length === 0 && (
                  <Typography>No models available</Typography>
               )}
               <List>
                  {availableModels.map((model) => (
                     <ListItem key={model} disablePadding>
                        <ListItemButton onClick={() => handleAdd(model)}>
                           <ListItemText primary={model} />
                        </ListItemButton>
                     </ListItem>
                  ))}
               </List>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            </DialogActions>
         </Dialog>
      </StyledCard>
   );
}
