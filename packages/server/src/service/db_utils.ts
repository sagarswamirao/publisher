import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import { BigQuery } from "@google-cloud/bigquery";
import * as snowflake from "snowflake-sdk";
import {
   ApiConnection,
   PostgresConnection,
   SnowflakeConnection,
} from "./model";
import { components } from "../api";

type ApiSchemaName = components["schemas"]["SchemaName"];

async function getPostgresConnection(
   apiPostgresConnection: PostgresConnection,
): Promise<Pool> {
   return new Pool({
      user: apiPostgresConnection.userName,
      host: apiPostgresConnection.host,
      database: apiPostgresConnection.databaseName,
      password: apiPostgresConnection.password,
      port: apiPostgresConnection.port,
      max: 10,
      idleTimeoutMillis: 30000,
   });
}

function getBigqueryConnection(apiConnection: ApiConnection): BigQuery {
   if (!apiConnection.bigqueryConnection?.serviceAccountKeyJson) {
      // Use default credentials
      return new BigQuery();
   } else {
      const tmpKeyPath = getTempServiceKeyPath(apiConnection);
      if (!tmpKeyPath) {
         throw new Error(
            `Failed to create temporary service key file for connection: ${apiConnection.name}`,
         );
      }
      return new BigQuery({ keyFilename: tmpKeyPath });
   }
}
async function getSnowflakeConnection(
   apiSnowflakeConnection: SnowflakeConnection,
): Promise<snowflake.Connection> {
   if (!apiSnowflakeConnection.account) {
      throw new Error("Snowflake account is required");
   }
   return snowflake.createConnection({
      account: apiSnowflakeConnection.account,
      username: apiSnowflakeConnection.username,
      password: apiSnowflakeConnection.password,
      database: apiSnowflakeConnection.database,
      warehouse: apiSnowflakeConnection.warehouse || undefined,
   });
}
// TODO(jjs) - only supports bigquery for now
export async function getSchemasForConnection(
   connection: ApiConnection,
): Promise<ApiSchemaName[]> {
   if (connection.type === "bigquery") {
      const bigquery = getBigqueryConnection(connection);
      // Set the projectId if it's provided in the bigqueryConnextion
      const [datasets] = await bigquery.getDatasets({
         ...(connection.bigqueryConnection?.defaultProjectId
            ? { projectId: connection.bigqueryConnection.defaultProjectId }
            : {}),
      });
      return datasets
         .filter((dataset) => dataset.id)
         .map((dataset) => {
            return {
               name: dataset.id,
               isHidden: false,
               isDefault: false,
            };
         });
   } else {
      //TODO(jjs) - implement
      return [];
   }
}

// TODO(jjs) - only supports bigquery for now
export async function getTablesForSchema(
   connection: ApiConnection,
   schemaName: string,
): Promise<string[]> {
   if (connection.type === "bigquery") {
      const bigquery = getBigqueryConnection(connection);
      try {
         const options = connection.bigqueryConnection?.defaultProjectId
            ? {
                 projectId: connection.bigqueryConnection?.defaultProjectId,
              }
            : {};
         const dataset = bigquery.dataset(schemaName, options);
         const [exists] = await dataset.exists();
         if (!exists) {
            throw new Error(
               `Dataset ${schemaName} does not exist in connection ${connection.name}`,
            );
         }

         const [tables] = await dataset.getTables();
         return tables.map((table) => table.id).filter((id) => id) as string[];
      } catch (error) {
         console.error(`Error getting tables for schema ${schemaName}`, error);
         throw new Error(`Error getting tables for schema ${schemaName}`, {
            cause: error,
         });
      }
   } else {
      // TODO(jjs) - implement
      return [];
   }
}

export async function getConnectionTables(
   connection: ApiConnection,
): Promise<string[]> {
   let tables: string[] = [];
   if (connection.type === "postgres") {
      const apiPostgresConnection = connection.postgresConnection;
      if (!apiPostgresConnection) {
         throw new Error("Postgres connection is required");
      }
      const pool = new Pool({
         user: apiPostgresConnection.userName,
         host: apiPostgresConnection.host,
         database: apiPostgresConnection.databaseName,
         password: apiPostgresConnection.password,
         port: apiPostgresConnection.port,
         max: 10,
         idleTimeoutMillis: 30000,
      });
      try {
         tables = await getTablesPGWithClient(pool, apiPostgresConnection);
      } catch (error) {
         console.error("Error connecting to Postgres", error);
         throw new Error("Error connecting to Postgres", {
            cause: error,
         });
      } finally {
         await pool.end();
      }
   } else if (connection.type === "bigquery") {
      if (!connection.bigqueryConnection) {
         throw new Error("BigQuery connection is required");
      }
      tables = await getTablesBQ(connection);
      // TODO: remove this hack once this is fully running on the server
      // Filter out some datasets for now to speed up local indexing
      // for the quick start guide (remove when indexing on server)
      tables = tables.filter((table) => {
         return (
            !table.startsWith("new_york_subway") &&
            !table.startsWith("google_political_ads")
         );
      });
   } else if (connection.type === "snowflake") {
      const apiSnowflakeConnection = connection.snowflakeConnection;
      if (!apiSnowflakeConnection) {
         throw new Error("Snowflake connection is required");
      }
      if (!apiSnowflakeConnection.account) {
         throw new Error("Snowflake account is required");
      }
      const snowflakeConn = snowflake.createConnection({
         account: apiSnowflakeConnection.account,
         username: apiSnowflakeConnection.username,
         password: apiSnowflakeConnection.password,
         database: apiSnowflakeConnection.database,
         warehouse: apiSnowflakeConnection.warehouse || undefined,
      });
      try {
         await new Promise((resolve, reject) => {
            snowflakeConn.connect((err) => (err ? reject(err) : resolve(true)));
         });
         tables = await getTablesSnowflakeWithConnection(
            snowflakeConn,
            apiSnowflakeConnection,
         );
      } catch (error) {
         throw new Error("Error connecting to Snowflake", {
            cause: error,
         });
      } finally {
         snowflakeConn.destroy(function (err) {
            if (err) {
               console.error("Snowflake unable to disconnect: " + err.message);
            }
         });
      }
   } else {
      console.error(
         `Unsupported indexing backend for ${connection.name}: ${connection.type}`,
      );
   }
   console.log(`Found ${tables.length} tables for ${connection.name}`);
   return tables;
}

async function getTablesPGWithClient(
   pool: Pool,
   connInfo: PostgresConnection,
): Promise<string[]> {
   let client;
   try {
      client = await pool.connect();
      const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
      return tablesResult.rows.map((row) => row.table_name);
   } catch (error) {
      console.error(
         `Error connecting to PostgreSQL (${connInfo.databaseName}):`,
         error,
      );
      return [];
   } finally {
      if (client) {
         client.release();
      }
   }
}

async function getTablesBQ(connection: ApiConnection): Promise<string[]> {
   const tmpKeyPath = getTempServiceKeyPath(connection);
   if (!tmpKeyPath) {
      throw new Error(
         `Failed to create temporary service key file for connection: ${connection.name}`,
      );
   }
   try {
      const bigquery = new BigQuery({
         keyFilename: tmpKeyPath,
      });

      // NOTE: we currently just pull data from the default project
      // associated with the service account. If we want to find
      // datasets in other projects, we need to use the
      // ProjectsClient to list projects and then pass each below
      // like: getDatasets({projectId: 'bigquery-public-data'})

      // Fetch all datasets in the project
      const [datasets] = await bigquery.getDatasets();

      console.log(
         `Found ${datasets.length} datasets in bigquery connection: ${connection.name}`,
      );
      if (!datasets.length) {
         console.log(`No datasets found in connection: ${connection.name}`);
         return [];
      }

      let tableNames: string[] = [];

      for (const dataset of datasets) {
         const [tables] = await dataset.getTables();

         // Append dataset name to each table to avoid duplicate table names
         const datasetTableNames = tables
            .map((table) =>
               table.id ? `${dataset.id}.${table.id}` : undefined,
            )
            .filter((id): id is string => !!id); // Ensure only valid strings are included

         tableNames = [...tableNames, ...datasetTableNames];
      }

      return tableNames;
   } catch (error) {
      console.error("Error fetching tables from BigQuery:", error);
      return [];
   } finally {
      try {
         fs.unlinkSync(tmpKeyPath);
      } catch (err) {
         console.error("Error deleting temporary key file:", err);
      }
   }
}

function getTempServiceKeyPath(connection: ApiConnection): string {
   // If the connection is bigquery and the service account key is provided as
   // JSON, we need to write it to a temporary file for the Malloy compiling to work
   if (!connection.bigqueryConnection) {
      throw new Error(
         `BigQuery connection ${connection.name} is missing bigqueryConnection ${JSON.stringify(connection)}`,
      );
   }
   const keyJson = connection.bigqueryConnection.serviceAccountKeyJson;
   if (!keyJson) {
      throw new Error(
         `BigQuery connection ${connection.name} is missing service account key JSON`,
      );
   }
   const tmpFilepath = path.join(
      os.tmpdir(),
      `ms2_connection_${connection.name}_${uuidv4()}_key.json`,
   );
   fs.writeFileSync(tmpFilepath, keyJson, "utf8");
   return tmpFilepath;
}

async function getTablesSnowflakeWithConnection(
   connection: snowflake.Connection,
   connInfo: SnowflakeConnection,
): Promise<string[]> {
   return new Promise((resolve, reject) => {
      connection.execute({
         sqlText: `USE DATABASE ${connInfo?.database} `,
         complete: (err) => {
            if (err) {
               console.error(
                  `Error setting database ${connInfo.database}:`,
                  err,
               );
               reject([]);
               return;
            }

            const query = `
          SELECT TABLE_NAME, TABLE_SCHEMA
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'SNOWFLAKE', 'SNOWFLAKE_SAMPLE_DATA') AND TABLE_TYPE = 'BASE TABLE';
        `;

            connection.execute({
               sqlText: query,
               complete: (err, _, rows) => {
                  if (err) {
                     console.error(
                        `Error fetching tables from ${connInfo.database}:`,
                        err,
                     );
                     reject([]);
                  } else {
                     resolve(
                        rows?.map(
                           (row) => `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`,
                        ) || [],
                     );
                  }
               },
            });
         },
      });
   });
}
