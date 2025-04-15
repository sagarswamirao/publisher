import * as fs from "fs/promises";
import { Project } from "./project";
import { components } from "../api";
import * as path from "path";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
    private serverRootPath: string;
    private singleProjectName?: string;
    private projects: Map<string, Project> = new Map();

    constructor(serverRootPath: string, singleProjectName?: string) {
        this.serverRootPath = serverRootPath;
        this.singleProjectName = singleProjectName;
    }

    public async listProjects(): Promise<ApiProject[]> {
        if (this.singleProjectName) {
            return [{ name: this.singleProjectName }];
        }

        const files = await fs.readdir(this.serverRootPath, { withFileTypes: true });
        const packageMetadata = await Promise.all(
            files
                .filter((file) => file.isDirectory())
                .map(async (directory) => {
                    try {
                        return await this.getProject(directory.name);
                    } catch {
                        return undefined;
                    }
                }),
        );
        // Get rid of undefined entries (i.e, directories without malloy-package.json files).
        return packageMetadata.filter((metadata) => metadata) as ApiProject[];
    }

    public async getProject(projectName: string): Promise<Project> {
        let project = this.projects.get(projectName);
        if (project === undefined) {
            project = await Project.create(
                path.join(this.serverRootPath, projectName),
            );
            this.projects.set(projectName, project);
        }
        return project;
    }
}
