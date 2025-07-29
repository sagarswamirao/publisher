import { Storage } from "@google-cloud/storage";
import * as fs from "fs/promises";
import * as path from "path";
import { components } from "../api";
import { getPublisherConfig, isPublisherConfigFrozen } from "../config";
import { API_PREFIX, PUBLISHER_CONFIG_NAME } from "../constants";
import { FrozenConfigError, ProjectNotFoundError } from "../errors";
import { logger } from "../logger";
import { Project } from "./project";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
   public serverRootPath: string;
   private projects: Map<string, Project> = new Map();
   public publisherConfigIsFrozen: boolean;
   public finishedInitialization: Promise<void>;

   constructor(serverRootPath: string) {
      this.serverRootPath = serverRootPath;
      this.finishedInitialization = this.initialize();
   }

   private async initialize() {
      try {
         this.publisherConfigIsFrozen = isPublisherConfigFrozen(
            this.serverRootPath,
         );
         const projectManifest = await ProjectStore.reloadProjectManifest(
            this.serverRootPath,
         );
         logger.info(`Initializing project store.`);
         for (const projectName of Object.keys(projectManifest.projects)) {
            logger.info(`Adding project "${projectName}"`);
            await this.addProject(
               {
                  name: projectName,
                  resource: `${API_PREFIX}/projects/${projectName}`,
               },
               true,
            );
         }
         logger.info("Project store successfully initialized");
      } catch (error) {
         logger.error("Error initializing project store", { error });
         process.exit(1);
      }
   }

   public async listProjects() {
      await this.finishedInitialization;
      return Array.from(this.projects.values()).map(
         (project) => project.metadata,
      );
   }

   public async getProject(
      projectName: string,
      reload: boolean,
   ): Promise<Project> {
      await this.finishedInitialization;
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

   public async addProject(
      project: ApiProject,
      skipInitialization: boolean = false,
   ) {
      if (!skipInitialization) {
         await this.finishedInitialization;
      }
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
      const absoluteProjectPath = await this.loadProjectIntoDisk(
         projectName,
         projectPath,
      );
      const newProject = await Project.create(projectName, absoluteProjectPath);
      this.projects.set(projectName, newProject);
      return newProject;
   }

   public async updateProject(project: ApiProject) {
      await this.finishedInitialization;
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
      await this.finishedInitialization;
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

   public static async reloadProjectManifest(serverRootPath: string) {
      try {
         return getPublisherConfig(serverRootPath);
      } catch (error) {
         if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            logger.error(
               `Error reading ${PUBLISHER_CONFIG_NAME}. Generating from directory`,
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

   private async loadProjectIntoDisk(projectName: string, projectPath: string) {
      const absoluteTargetPath = `/etc/publisher/${projectName}`;
      // Handle absolute paths
      if (projectPath.startsWith("/")) {
         const projectDirExists = (await fs.stat(projectPath)).isDirectory();
         if (projectDirExists) {
            logger.info(`Loading mounted project at "${projectPath}"`);
            // Recursively copy projectPath into /etc/publisher/${projectName}
            await fs.rm(absoluteTargetPath, { recursive: true, force: true });
            await fs.mkdir(absoluteTargetPath, { recursive: true });
            await fs.cp(projectPath, absoluteTargetPath, {
               recursive: true,
            });
         } else {
            throw new ProjectNotFoundError(
               `Project ${projectName} not found in "${projectPath}"`,
            );
         }
         return absoluteTargetPath;
      }

      // Handle GCS URIs
      if (projectPath.startsWith("gs://")) {
         // Download from GCS
         try {
            logger.info(
               `Downloading GCS path "${projectPath}" to "${absoluteTargetPath}"`,
            );
            await this.downloadGcsDirectory(
               projectPath,
               projectName,
               absoluteTargetPath,
            );
         } catch (error) {
            logger.error(`Failed to download GCS path "${projectPath}"`, {
               error,
            });
            throw error;
         }
         return absoluteTargetPath;
      }

      // Handle S3 URIs

      // Handle GitHub URIs
      const errorMsg = `Invalid project path: "${projectPath}". Must be an absolute mounted path or a GCS/S3/GitHub URI.`;
      logger.error(errorMsg, { projectName, projectPath });
      throw new ProjectNotFoundError(errorMsg);
   }

   private async downloadGcsDirectory(
      gcsPath: string,
      projectName: string,
      absoluteDirPath: string,
   ) {
      const trimmedPath = gcsPath.slice(5);
      const gcsClient = new Storage();
      const [bucketName, prefix] = trimmedPath.split("/", 2);
      const [files] = await gcsClient.bucket(bucketName).getFiles({
         prefix,
      });
      if (files.length === 0) {
         throw new ProjectNotFoundError(
            `Project ${projectName} not found in ${gcsPath}`,
         );
      }
      await fs.rm(absoluteDirPath, { recursive: true, force: true });
      await fs.mkdir(absoluteDirPath, { recursive: true });
      await Promise.all(
         files.map(async (file) => {
            const relativeFilePath = file.name.replace(prefix, "");
            const absoluteFilePath = path.join(
               absoluteDirPath,
               relativeFilePath,
            );
            if (file.name.endsWith("/")) {
               return;
            }
            await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
            return fs.writeFile(absoluteFilePath, await file.download());
         }),
      );
   }
}
