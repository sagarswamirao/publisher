import * as fs from "fs/promises";
import { Project } from "./project";
import { components } from "../api";
import * as path from "path";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
    private serverRootPath: string;
    private projects: Map<string, Project> = new Map();

    constructor(serverRootPath: string) {
        this.serverRootPath = serverRootPath;
    }

    public async listProjects(): Promise<ApiProject[]> {
        const projectManifestJson = await ProjectStore.getProjectManifest(this.serverRootPath);
        return Object.keys(projectManifestJson.projects).map((projectName) => ({
            name: projectName,
        })) as ApiProject[];
    }

    public async getProject(projectName: string): Promise<Project> {
        let project = this.projects.get(projectName);
        if (project === undefined) {
            const projectManifestJson = await ProjectStore.getProjectManifest(this.serverRootPath);

            if (projectManifestJson.projects[projectName] === undefined) {
                throw new Error(`Project ${projectName} not found in publisher.config.json`);
            }

            project = await Project.create(
                path.join(this.serverRootPath, projectManifestJson.projects[projectName]),
            );
            this.projects.set(projectName, project);
        }
        return project;
    }

    private static async getProjectManifest(
        serverRootPath: string,
    ): Promise<{ projects: { [key: string]: string } }> {
        const projectManifest = await fs.readFile(path.join(serverRootPath, "publisher.config.json"), "utf8");
        return JSON.parse(projectManifest);
    }
}
