import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import React, { HTMLInputTypeAttribute, useState } from "react";

import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import {
   BigqueryConnection,
   Connection,
   ConnectionTypeEnum,
   MysqlConnection,
   PostgresConnection,
   SnowflakeConnection,
   TrinoConnection,
} from "../../client/api";

type ConnectionField = {
   label: string;
   name: keyof (PostgresConnection &
      BigqueryConnection &
      SnowflakeConnection &
      TrinoConnection &
      MysqlConnection);
   type: HTMLInputTypeAttribute;
   required?: boolean;
};

const connectionFieldsByType: Record<
   ConnectionTypeEnum,
   Array<ConnectionField>
> = {
   postgres: [
      {
         label: "Host",
         name: "host",
         type: "text",
      },
      {
         label: "Port",
         name: "port",
         type: "number",
      },
      {
         label: "Database Name",
         name: "databaseName",
         type: "text",
      },
      {
         label: "User Name",
         name: "userName",
         type: "text",
      },
      {
         label: "Password",
         name: "password",
         type: "password",
      },
      {
         label: "Connection String",
         name: "connectionString",
         type: "text",
      },
   ],
   bigquery: [
      {
         label: "Project ID",
         name: "defaultProjectId",
         type: "text",
      },
      {
         label: "Billing Project ID",
         name: "billingProjectId",
         type: "text",
      },
      {
         label: "Location",
         name: "location",
         type: "text",
      },
      {
         label: "Service Account Key JSON",
         name: "serviceAccountKeyJson",
         type: "text",
      },
      {
         label: "Maximum Bytes Billed",
         name: "maximumBytesBilled",
         type: "text",
      },
      {
         label: "Query Timeout Milliseconds",
         name: "queryTimeoutMilliseconds",
         type: "text",
      },
   ],
   snowflake: [
      {
         label: "Account",
         name: "account",
         type: "text",
      },
      {
         label: "Username",
         name: "username",
         type: "text",
      },
      {
         label: "Password",
         name: "password",
         type: "password",
      },
      {
         label: "Warehouse",
         name: "warehouse",
         type: "text",
      },
      {
         label: "Database",
         name: "database",
         type: "text",
      },
      {
         label: "Schema",
         name: "schema",
         type: "text",
      },
      {
         label: "Response Timeout Milliseconds",
         name: "responseTimeoutMilliseconds",
         type: "text",
      },
   ],
   trino: [
      {
         label: "Server",
         name: "server",
         type: "text",
      },
      {
         label: "Port",
         name: "port",
         type: "number",
      },
      {
         label: "Catalog",
         name: "catalog",
         type: "text",
      },
      {
         label: "Schema",
         name: "schema",
         type: "text",
      },
      {
         label: "User",
         name: "user",
         type: "text",
      },
      {
         label: "Password",
         name: "password",
         type: "password",
      },
   ],
   mysql: [
      {
         label: "Host",
         name: "host",
         type: "text",
      },
      {
         label: "Port",
         name: "port",
         type: "number",
      },
      {
         label: "User",
         name: "user",
         type: "text",
      },
      {
         label: "Password",
         name: "password",
         type: "password",
      },
      {
         label: "Database",
         name: "database",
         type: "text",
      },
   ],
};

const attributesFieldName: Record<ConnectionTypeEnum, string> = {
   postgres: "postgresConnection",
   bigquery: "bigqueryConnection",
   snowflake: "snowflakeConnection",
   trino: "trinoConnection",
   mysql: "mysqlConnection",
};

type EditConnectionDialogProps = {
   connection: Connection;
   onSubmit: (connection: Connection) => Promise<unknown>;
   isSubmitting: boolean;
};

export default function EditConnectionDialog({
   connection,
   onSubmit,
   isSubmitting,
}: EditConnectionDialogProps) {
   const [open, setOpen] = useState(false);
   const [type, setType] = useState<Connection["type"]>(connection.type);
   const handleClickOpen = () => {
      setOpen(true);
   };

   const handleClose = () => {
      setOpen(false);
   };

   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const name = formData.get("name")?.toString();
      const type = formData.get("type")?.toString() as ConnectionTypeEnum;
      const fields = connectionFieldsByType[type];
      if (!name) {
         throw new Error("Name is required");
      }
      if (!type) {
         throw new Error("Type is required");
      }
      const connectionPayload = {
         name,
         type,
         [attributesFieldName[type]]: fields.reduce((acc, field) => {
            acc[field.name] =
               formData.get(field.name)?.toString() ??
               connection[attributesFieldName[type]][field.name];
            return acc;
         }, {}),
      } satisfies Connection;
      await onSubmit(connectionPayload);
      handleClose();
   };

   return (
      <React.Fragment>
         <IconButton
            onClick={(event) => {
               event.preventDefault();
               event.stopPropagation();
               handleClickOpen();
            }}
         >
            <Edit />
         </IconButton>
         <Dialog open={open} onClose={handleClose}>
            <DialogTitle
               onClick={(event) => {
                  event.stopPropagation();
               }}
            >
               Edit Connection
            </DialogTitle>
            <DialogContent
               onClick={(event) => {
                  event.stopPropagation();
               }}
            >
               <DialogContentText>
                  Edit a connection to query your data database using Malloy.
               </DialogContentText>
               <form onSubmit={handleSubmit} id="connection-form">
                  <TextField
                     autoFocus
                     required
                     margin="dense"
                     id="name"
                     name="name"
                     label="Connection Name"
                     type="text"
                     fullWidth
                     variant="standard"
                     value={connection.name}
                     defaultValue={connection.name}
                  />
                  <TextField
                     margin="dense"
                     id="type"
                     name="type"
                     label="Connection Type"
                     fullWidth
                     variant="standard"
                     value={type}
                     select
                     onChange={(event) =>
                        setType(event.target.value as ConnectionTypeEnum)
                     }
                  >
                     {Object.values(ConnectionTypeEnum).map((type) => (
                        <MenuItem key={type} value={type}>
                           {type}
                        </MenuItem>
                     ))}
                  </TextField>
                  {connectionFieldsByType[type].map((field) => (
                     <TextField
                        key={field.name}
                        margin="dense"
                        id={field.name}
                        name={field.name}
                        label={field.label}
                        type={field.type}
                        fullWidth
                        variant="standard"
                        defaultValue={
                           connection?.[attributesFieldName[type] ?? ""]?.[
                              field.name ?? ""
                           ] ?? ""
                        }
                     />
                  ))}
               </form>
            </DialogContent>
            <DialogActions
               onClick={(event) => {
                  event.stopPropagation();
               }}
            >
               <Button disabled={isSubmitting} onClick={handleClose}>
                  Cancel
               </Button>
               <Button
                  type="submit"
                  form="connection-form"
                  loading={isSubmitting}
               >
                  Edit Connection
               </Button>
            </DialogActions>
         </Dialog>
      </React.Fragment>
   );
}
