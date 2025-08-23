import {
   RunSQLOptions,
   TableSourceDef,
   TestableConnection,
} from "@malloydata/malloy";
import { Connection, PersistSQLResults } from "@malloydata/malloy/connection";
import { BadRequestError, ConnectionError } from "../errors";
import { logger } from "../logger";
import { components } from "../api";
import {
   getSchemasForConnection,
   getTablesForSchema,
} from "../service/db_utils";
import { ProjectStore } from "../service/project_store";
import { testConnectionConfig } from "../service/connection";
type ApiConnection = components["schemas"]["Connection"];
type ApiConnectionStatus = components["schemas"]["ConnectionStatus"];
type ApiSqlSource = components["schemas"]["SqlSource"];
type ApiTableSource = components["schemas"]["TableSource"];
type ApiQueryData = components["schemas"]["QueryData"];
type ApiTemporaryTable = components["schemas"]["TemporaryTable"];
type ApiSchemaName = components["schemas"]["SchemaName"];
export class ConnectionController {
   private projectStore: ProjectStore;

   constructor(projectStore: ProjectStore) {
      this.projectStore = projectStore;
   }

   public async getConnection(
      projectName: string,
      connectionName: string,
   ): Promise<ApiConnection> {
      const project = await this.projectStore.getProject(projectName, false);
      return project.getApiConnection(connectionName);
   }

   public async listConnections(projectName: string): Promise<ApiConnection[]> {
      const project = await this.projectStore.getProject(projectName, false);
      return project.listApiConnections();
   }

   // Lists schemas (namespaces) available in a connection
   public async listSchemas(
      projectName: string,
      connectionName: string,
   ): Promise<ApiSchemaName[]> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getInternalConnection(connectionName);
      return getSchemasForConnection(connection);
   }

   // Lists tables available in a schema. For postgres the schema is usually "public"
   public async listTables(
      projectName: string,
      connectionName: string,
      schemaName: string,
   ): Promise<string[]> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getInternalConnection(connectionName);
      return getTablesForSchema(connection, schemaName);
   }

   public async testConnection(
      projectName: string,
      connectionName: string,
   ): Promise<ApiConnectionStatus> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getMalloyConnection(
         connectionName,
      ) as Connection;
      try {
         await (connection as TestableConnection).test();
         return {
            status: "ok",
            errorMessage: "",
         };
      } catch (error) {
         if (error instanceof ConnectionError) {
            return {
               status: "failed",
               errorMessage: error.message,
            };
         }
         throw error;
      }
   }

   public async getConnectionSqlSource(
      projectName: string,
      connectionName: string,
      sqlStatement: string,
   ): Promise<ApiSqlSource> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getMalloyConnection(connectionName);
      try {
         return {
            source: JSON.stringify(
               await connection.fetchSelectSchema({
                  connection: connectionName,
                  selectStr: sqlStatement,
               }),
            ),
         };
      } catch (error) {
         throw new ConnectionError((error as Error).message);
      }
   }

   public async getConnectionTableSource(
      projectName: string,
      connectionName: string,
      tableKey: string,
      tablePath: string,
   ): Promise<ApiTableSource> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getMalloyConnection(connectionName);
      try {
         const source = await connection.fetchTableSchema(tableKey, tablePath);
         if (source === undefined) {
            throw new ConnectionError(`Table ${tablePath} not found`);
         }
         const malloyFields = (source as TableSourceDef).fields;
         const fields = malloyFields.map((field) => {
            return {
               name: field.name,
               type: field.type,
            };
         });
         return {
            source: JSON.stringify(source),
            resource: tablePath,
            columns: fields,
         };
      } catch (error) {
         logger.error("error", { error });
         throw new ConnectionError((error as Error).message);
      }
   }

   public async getConnectionQueryData(
      projectName: string,
      connectionName: string,
      sqlStatement: string,
      options: string,
   ): Promise<ApiQueryData> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getMalloyConnection(connectionName);
      let runSQLOptions: RunSQLOptions = {};
      if (options) {
         runSQLOptions = JSON.parse(options) as RunSQLOptions;
      }
      if (runSQLOptions.abortSignal) {
         // Add support for abortSignal in the future
         logger.info("Clearing unsupported abortSignal");
         runSQLOptions.abortSignal = undefined;
      }

      try {
         return {
            data: JSON.stringify(
               await connection.runSQL(sqlStatement, runSQLOptions),
            ),
         };
      } catch (error) {
         throw new ConnectionError((error as Error).message);
      }
   }

   public async getConnectionTemporaryTable(
      projectName: string,
      connectionName: string,
      sqlStatement: string,
   ): Promise<ApiTemporaryTable> {
      const project = await this.projectStore.getProject(projectName, false);
      const connection = project.getMalloyConnection(
         connectionName,
      ) as Connection;

      try {
         return {
            table: JSON.stringify(
               await (connection as PersistSQLResults).manifestTemporaryTable(
                  sqlStatement,
               ),
            ),
         };
      } catch (error) {
         throw new ConnectionError((error as Error).message);
      }
   }

   public async testConnectionConfiguration(
      connectionConfig: any,
   ): Promise<ApiConnectionStatus> {
      if (
         !connectionConfig ||
         typeof connectionConfig !== "object" ||
         Object.keys(connectionConfig).length === 0
      ) {
         throw new BadRequestError(
            "Connection configuration is required and cannot be empty",
         );
      }

      if (!connectionConfig.type || typeof connectionConfig.type !== "string") {
         throw new BadRequestError(
            "Connection type is required and must be a string",
         );
      }

      try {
         return await testConnectionConfig(connectionConfig);
      } catch (error) {
         return {
            status: "failed",
            errorMessage: `Connection test failed: ${(error as Error).message}`,
         };
      }
   }
}
