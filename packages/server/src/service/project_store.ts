import * as fs from "fs/promises";
import * as path from "path";
import { components } from "../api";
import { API_PREFIX } from "../constants";
import { FrozenConfigError, ProjectNotFoundError } from "../errors";
import { logger } from "../logger";
import { isPublisherConfigFrozen } from "../utils";
import { Project } from "./project";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
   private serverRootPath: string;
   private projects: Map<string, Project> = new Map();
   public publisherConfigIsFrozen: boolean;

   constructor(serverRootPath: string) {
      this.serverRootPath = serverRootPath;
      void this.initialize();
   }

   private async initialize() {
      try {
         this.publisherConfigIsFrozen = isPublisherConfigFrozen(
            this.serverRootPath,
         );
         const projectManifest = await ProjectStore.reloadProjectManifest(
            this.serverRootPath,
         );
         for (const projectName of Object.keys(projectManifest.projects)) {
            const projectPath = projectManifest.projects[projectName];
            const absoluteProjectPath = path.join(
               this.serverRootPath,
               projectPath,
            );
            const project = await Project.create(
               projectName,
               absoluteProjectPath,
            );
            this.projects.set(projectName, project);
         }
         logger.info("Project store successfully initialized");
      } catch (error) {
         logger.error("Error initializing project store", { error });
         process.exit(1);
      }
   }

   public listProjects() {
      return Array.from(this.projects.values()).map(
         (project) => project.metadata,
      );
   }

   public async getProject(
      projectName: string,
      reload: boolean,
   ): Promise<Project> {
      let project = this.projects.get(projectName);
      if (project === undefined || reload) {
         const projectManifest = await ProjectStore.reloadProjectManifest(
            this.serverRootPath,
         );
         if (
            !projectManifest.projects ||
            !projectManifest.projects[projectName]
         ) {
            throw new ProjectNotFoundError(
               `Project "${projectName}" not found in publisher`,
            );
         }
         project = await this.addProject({
            name: projectName,
            resource: `${API_PREFIX}/projects/${projectName}`,
         });
      }
      return project;
   }

   public async addProject(project: ApiProject) {
      if (this.publisherConfigIsFrozen) {
         throw new FrozenConfigError();
      }
      const projectName = project.name;
      if (!projectName) {
         throw new Error("Project name is required");
      }
      const projectManifest = await ProjectStore.reloadProjectManifest(
         this.serverRootPath,
      );
      const projectPath = projectManifest.projects[projectName];
      if (!projectPath) {
         throw new ProjectNotFoundError(
            `Project "${projectName}" not found in publisher.config.json`,
         );
      }
      const absoluteProjectPath = path.join(this.serverRootPath, projectPath);
      if (!(await fs.stat(absoluteProjectPath)).isDirectory()) {
         throw new ProjectNotFoundError(
            `Project ${projectName} not found in ${absoluteProjectPath}`,
         );
      }
      const newProject = await Project.create(projectName, absoluteProjectPath);
      this.projects.set(projectName, newProject);
      return newProject;
   }

   public async updateProject(project: ApiProject) {
      if (this.publisherConfigIsFrozen) {
         throw new FrozenConfigError();
      }
      const projectName = project.name;
      if (!projectName) {
         throw new Error("Project name is required");
      }
      const existingProject = this.projects.get(projectName);
      if (!existingProject) {
         throw new ProjectNotFoundError(`Project ${projectName} not found`);
      }
      const updatedProject = await existingProject.update(project);
      this.projects.set(projectName, updatedProject);
      return updatedProject;
   }

   public async deleteProject(projectName: string) {
      if (this.publisherConfigIsFrozen) {
         throw new FrozenConfigError();
      }
      const project = this.projects.get(projectName);
      if (!project) {
         throw new ProjectNotFoundError(`Project ${projectName} not found`);
      }
      this.projects.delete(projectName);
      return project;
   }

   private static async reloadProjectManifest(
      serverRootPath: string,
   ): Promise<{ projects: { [key: string]: string } }> {
      try {
         const projectManifestContent = await fs.readFile(
            path.join(serverRootPath, "publisher.config.json"),
            "utf8",
         );
         return JSON.parse(projectManifestContent);
      } catch (error) {
         if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            logger.error(
               `Error reading publisher.config.json. Generating from directory`,
               { error },
            );
            return { projects: {} };
         } else {
            // If publisher.config.json is missing, generate the manifest from directories
            try {
               const entries = await fs.readdir(serverRootPath, {
                  withFileTypes: true,
               });
               const projects: { [key: string]: string } = {};
               for (const entry of entries) {
                  if (entry.isDirectory()) {
                     projects[entry.name] = entry.name;
                  }
               }
               return { projects };
            } catch (lsError) {
               logger.error(`Error listing directories in ${serverRootPath}`, {
                  error: lsError,
               });
               return { projects: {} };
            }
         }
      }
   }
}
