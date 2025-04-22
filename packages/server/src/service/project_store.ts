import * as fs from "fs/promises";
import { Project } from "./project";
import { components } from "../api";
import * as path from "path";
import { ProjectNotFoundError } from "../errors";
import { API_PREFIX } from "../constants";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
    private serverRootPath: string;
    private projects: Map<string, Project> = new Map();

    constructor(serverRootPath: string) {
        this.serverRootPath = serverRootPath;
    }

    public async listProjects(): Promise<ApiProject[]> {
        const projectManifest = await ProjectStore.getProjectManifest(this.serverRootPath);
        if (!projectManifest.projects) {
            return [];
        } else {
            return Object.keys(projectManifest.projects).map((projectName) => ({
                name: projectName,
                resource: `${API_PREFIX}/projects/${projectName}`,
            })) as ApiProject[];
        }
    }

    public async getProject(projectName: string, reload: boolean): Promise<Project> {
        let project = this.projects.get(projectName);
        if (project === undefined || reload) {
            const projectManifest = await ProjectStore.getProjectManifest(this.serverRootPath);
            if (!projectManifest.projects || !projectManifest.projects[projectName]) {
                throw new ProjectNotFoundError(`Project ${projectName} not found in publisher.config.json`);
            }
            project = await Project.create(
                projectName,
                path.join(this.serverRootPath, projectManifest.projects[projectName]),
            );
            this.projects.set(projectName, project);
        }
        return project;
    }

    private static async getProjectManifest(
        serverRootPath: string,
    ): Promise<{ projects: { [key: string]: string } }> {
        try {
            const projectManifest = await fs.readFile(path.join(serverRootPath, "publisher.config.json"), "utf8");
            return JSON.parse(projectManifest);
        } catch (error) {
            return { projects: {} };
        }
    }
}
