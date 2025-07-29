import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import { Writable } from "stream";
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
   private s3Client = new S3({
      followRegionRedirects: true,
   });
   private gcsClient = new Storage();

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
               const entries = await fs.promises.readdir(serverRootPath, {
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
         try {
            logger.info(`Mounting local directory at "${projectPath}"`);
            await this.mountLocalDirectory(
               projectPath,
               absoluteTargetPath,
               projectName,
            );
            return absoluteTargetPath;
         } catch (error) {
            logger.error(`Failed to mount local directory "${projectPath}"`, {
               error,
            });
            throw error;
         }
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
      if (projectPath.startsWith("s3://")) {
         try {
            logger.info(`Mounting S3 path "${projectPath}"`);
            await this.downloadS3Directory(
               projectPath,
               projectName,
               absoluteTargetPath,
            );
            return absoluteTargetPath;
         } catch (error) {
            logger.error(`Failed to mount S3 path "${projectPath}"`, { error });
            throw error;
         }
      }

      // Handle GitHub URIs
      const errorMsg = `Invalid project path: "${projectPath}". Must be an absolute mounted path or a GCS/S3/GitHub URI.`;
      logger.error(errorMsg, { projectName, projectPath });
      throw new ProjectNotFoundError(errorMsg);
   }

   private async mountLocalDirectory(
      projectPath: string,
      absoluteTargetPath: string,
      projectName: string,
   ) {
      const projectDirExists = (
         await fs.promises.stat(projectPath)
      ).isDirectory();
      if (projectDirExists) {
         // Recursively copy projectPath into /etc/publisher/${projectName}
         await fs.promises.rm(absoluteTargetPath, {
            recursive: true,
            force: true,
         });
         await fs.promises.mkdir(absoluteTargetPath, { recursive: true });
         await fs.promises.cp(projectPath, absoluteTargetPath, {
            recursive: true,
         });
      } else {
         throw new ProjectNotFoundError(
            `Project ${projectName} not found in "${projectPath}"`,
         );
      }
   }

   private async downloadGcsDirectory(
      gcsPath: string,
      projectName: string,
      absoluteDirPath: string,
   ) {
      const trimmedPath = gcsPath.slice(5);
      const [bucketName, prefix] = trimmedPath.split("/", 2);
      const [files] = await this.gcsClient.bucket(bucketName).getFiles({
         prefix,
      });
      if (files.length === 0) {
         throw new ProjectNotFoundError(
            `Project ${projectName} not found in ${gcsPath}`,
         );
      }
      await fs.promises.rm(absoluteDirPath, { recursive: true, force: true });
      await fs.promises.mkdir(absoluteDirPath, { recursive: true });
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
            await fs.promises.mkdir(path.dirname(absoluteFilePath), {
               recursive: true,
            });
            return fs.promises.writeFile(
               absoluteFilePath,
               await file.download(),
            );
         }),
      );
   }

   private async downloadS3Directory(
      s3Path: string,
      projectName: string,
      absoluteDirPath: string,
   ) {
      const trimmedPath = s3Path.slice(5);
      const [bucketName, prefix] = trimmedPath.split("/", 2);
      const objects = await this.s3Client.listObjectsV2({
         Bucket: bucketName,
         Prefix: prefix,
      });
      await fs.promises.rm(absoluteDirPath, { recursive: true, force: true });
      await fs.promises.mkdir(absoluteDirPath, { recursive: true });

      if (!objects.Contents || objects.Contents.length === 0) {
         throw new ProjectNotFoundError(
            `Project ${projectName} not found in ${s3Path}`,
         );
      }
      await Promise.all(
         objects.Contents?.map(async (object) => {
            const key = object.Key;
            if (!key) {
               return;
            }
            const relativeFilePath = key.replace(prefix, "");
            if (!relativeFilePath || relativeFilePath.endsWith("/")) {
               return;
            }
            const absoluteFilePath = path.join(
               absoluteDirPath,
               relativeFilePath,
            );
            await fs.promises.mkdir(path.dirname(absoluteFilePath), {
               recursive: true,
            });
            const command = new GetObjectCommand({
               Bucket: bucketName,
               Key: key,
            });
            const item = await this.s3Client.send(command);
            if (!item.Body) {
               return;
            }
            const file = fs.createWriteStream(absoluteFilePath);
            item.Body.transformToWebStream().pipeTo(Writable.toWeb(file));
            await new Promise<void>((resolve, reject) => {
               file.on("error", reject);
               file.on("finish", resolve);
            });
         }),
      );
   }
}
