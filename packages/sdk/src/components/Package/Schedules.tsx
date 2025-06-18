import {
   Box,
   Divider,
   Paper,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Typography,
} from "@mui/material";
import { Configuration, SchedulesApi } from "../../client";
import { StyledCard, StyledCardContent } from "../styles";
import { usePackage } from "./PackageProvider";
import { useServer } from "../ServerProvider";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";

const schedulesApi = new SchedulesApi(new Configuration());

export default function Schedules() {
   const { projectName, packageName, versionId } = usePackage();
   const { server, accessToken } = useServer();

   const { data, isError, isLoading, error } = useQueryWithApiError({
      queryKey: ["schedules", server, projectName, packageName, versionId],
      queryFn: () =>
         schedulesApi.listSchedules(projectName, packageName, versionId, {
            baseURL: server,
            withCredentials: !accessToken,
            headers: {
               Authorization: accessToken && `Bearer ${accessToken}`,
            },
         }),
   });

   if (isLoading) {
      return <Loading text="Fetching Schedules..." />;
   }

   if (isError) {
      return (
         <ApiErrorDisplay
            error={error}
            context={`${projectName} > ${packageName} > Schedules`}
         />
      );
   }

   if (!data.data.length) {
      return null;
   }

   return (
      <StyledCard variant="outlined" sx={{ padding: "10px", width: "100%" }}>
         <StyledCardContent>
            <Typography variant="overline" fontWeight="bold">
               Scheduler
            </Typography>
            <Divider />
            <Box
               sx={{
                  mt: "10px",
                  maxHeight: "200px",
                  overflowY: "auto",
               }}
            >
               <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 300 }} size="small">
                     <TableHead>
                        <TableRow>
                           <TableCell align="left">Resource</TableCell>
                           <TableCell align="left">Schedule</TableCell>
                           <TableCell align="left">Action</TableCell>
                           <TableCell align="left">Connection</TableCell>
                           <TableCell align="left">Last Run</TableCell>
                           <TableCell align="left">Status</TableCell>
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {data.data.map((m) => (
                           <TableRow
                              key={m.resource}
                              sx={{
                                 "&:last-child td, &:last-child th": {
                                    border: 0,
                                 },
                              }}
                           >
                              <TableCell align="left">{m.resource}</TableCell>
                              <TableCell align="left">{m.schedule}</TableCell>
                              <TableCell align="left">{m.action}</TableCell>
                              <TableCell align="left">{m.connection}</TableCell>
                              <TableCell align="left">
                                 {m.lastRunTime
                                    ? new Date(m.lastRunTime).toLocaleString()
                                    : "n/a"}
                              </TableCell>
                              <TableCell align="left">
                                 {m.lastRunStatus}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </TableContainer>
            </Box>
         </StyledCardContent>
      </StyledCard>
   );
}
