import { components } from "../api";
import { Project } from "../service/project";
import { RunSQLOptions, TestableConnection } from '@malloydata/malloy';
import { Connection, PersistSQLResults } from "@malloydata/malloy/connection";
type ApiConnection = components["schemas"]["Connection"];
import { ConnectionError } from "../errors";

export class ConnectionController {
    private project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    public async getConnection(connectionName: string): Promise<ApiConnection> {
        return this.project.getApiConnection(connectionName);
    }

    public async listConnections(): Promise<ApiConnection[]> {
        return this.project.listApiConnections();
    }

    public async testConnection(connectionName: string) {
        const connection = this.project.getMalloyConnection(connectionName) as Connection;
        try {
            await (connection as TestableConnection).test();
        } catch (error) {
            throw new ConnectionError((error as Error).message);
        }
    }

    public async getConnectionSqlSource(connectionName: string, sqlStatement: string): Promise<string> {
        const connection = this.project.getMalloyConnection(connectionName);
        try {
            return JSON.stringify(await connection.fetchSelectSchema({ connection: connectionName, selectStr: sqlStatement }));
        } catch (error) {
            throw new ConnectionError((error as Error).message);
        }
    }

    public async getConnectionTableSource(connectionName: string, tableKey: string, tablePath: string): Promise<string> {
        const connection = this.project.getMalloyConnection(connectionName);
        try {
            return JSON.stringify(await connection.fetchTableSchema(tableKey, tablePath));
        } catch (error) {
            throw new ConnectionError((error as Error).message);
        }
    }

    public async getConnectionQueryData(connectionName: string, sqlStatement: string, options: string): Promise<string> {
        const connection = this.project.getMalloyConnection(connectionName);
        const runSQLOptions = JSON.parse(options) as RunSQLOptions;
        try {
            return JSON.stringify(await connection.runSQL(sqlStatement, runSQLOptions));
        } catch (error) {
            throw new ConnectionError((error as Error).message);
        }
    }

    public async getConnectionTemporaryTable(connectionName: string, sqlStatement: string): Promise<string> {
        const connection = this.project.getMalloyConnection(connectionName) as Connection;

        try {
            return await (connection as PersistSQLResults).manifestTemporaryTable(sqlStatement);
        } catch (error) {
            throw new ConnectionError((error as Error).message);
        }
    }
}
