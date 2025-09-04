import {
   Box,
   Paper,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
} from "@mui/material";
import { Configuration, SchedulesApi } from "../../client";
import {
   PackageCard,
   PackageCardContent,
   PackageSectionTitle,
} from "../styles";
import { ApiErrorDisplay } from "../ApiErrorDisplay";
import { Loading } from "../Loading";
import { useQueryWithApiError } from "../../hooks/useQueryWithApiError";
import { parseResourceUri } from "../../utils/formatting";

const schedulesApi = new SchedulesApi(new Configuration());

type Props = {
   resourceUri: string;
};

export default function Schedules({ resourceUri }: Props) {
   const {
      project: projectName,
      package: packageName,
      version: versionId,
   } = parseResourceUri(resourceUri);

   const { data, isError, isLoading, error } = useQueryWithApiError({
      queryKey: ["schedules", projectName, packageName, versionId],
      queryFn: (config) =>
         schedulesApi.listSchedules(
            projectName,
            packageName,
            versionId,
            config,
         ),
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
      <PackageCard>
         <PackageCardContent>
            <PackageSectionTitle>Scheduler</PackageSectionTitle>
            <Box
               sx={{
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
         </PackageCardContent>
      </PackageCard>
   );
}
