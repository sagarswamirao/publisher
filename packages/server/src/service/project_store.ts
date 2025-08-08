import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import simpleGit from "simple-git";
import { Writable } from "stream";
import { components } from "../api";
import { getPublisherConfig, isPublisherConfigFrozen } from "../config";
import { API_PREFIX, PUBLISHER_CONFIG_NAME, publisherPath } from "../constants";
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
      const initialTime = performance.now();
      try {
         this.publisherConfigIsFrozen = isPublisherConfigFrozen(
            this.serverRootPath,
         );
         const projectManifest = await ProjectStore.reloadProjectManifest(
            this.serverRootPath,
         );
         logger.info(`Initializing project store.`);
         await Promise.all(
            Object.keys(projectManifest.projects).map(async (projectName) => {
               logger.info(`Adding project "${projectName}"`);
               const project = await this.addProject(
                  {
                     name: projectName,
                     resource: `${API_PREFIX}/projects/${projectName}`,
                     location: projectManifest.projects[projectName],
                  },
                  true,
               );
               return project.listPackages();
            }),
         );
         logger.info(
            `Project store successfully initialized in ${performance.now() - initialTime}ms`,
         );
      } catch (error) {
         logger.error("Error initializing project store", { error });
         console.error(error);
         process.exit(1);
      }
   }

   public async listProjects() {
      await this.finishedInitialization;
      return Promise.all(
         Array.from(this.projects.values()).map((project) =>
            project.serialize(),
         ),
      );
   }

   public async getProject(
      projectName: string,
      reload: boolean = false,
   ): Promise<Project> {
      await this.finishedInitialization;
      let project = this.projects.get(projectName);
      if (project === undefined || reload) {
         const projectManifest = await ProjectStore.reloadProjectManifest(
            this.serverRootPath,
         );
         const projectPath =
            project?.metadata.location || projectManifest.projects[projectName];
         if (!projectPath) {
            throw new ProjectNotFoundError(
               `Project "${projectName}" could not be resolved to a path.`,
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
      if (!skipInitialization && this.publisherConfigIsFrozen) {
         throw new FrozenConfigError();
      }

      const projectName = project.name;
      if (!projectName) {
         throw new Error("Project name is required");
      }
      const projectManifest = await ProjectStore.reloadProjectManifest(
         this.serverRootPath,
      );
      const projectPath =
         project.location || projectManifest.projects[projectName];
      let absoluteProjectPath: string;
      if (projectPath) {
         absoluteProjectPath = await this.loadProjectIntoDisk(
            projectName,
            projectPath,
         );
         if (absoluteProjectPath.endsWith(".zip")) {
            absoluteProjectPath = await this.unzipProject(absoluteProjectPath);
         }
      } else {
         absoluteProjectPath = await this.scaffoldProject(project);
      }
      const newProject = await Project.create(
         projectName,
         absoluteProjectPath,
         project.connections || [],
      );
      this.projects.set(projectName, newProject);
      return newProject;
   }

   public async unzipProject(absoluteProjectPath: string) {
      logger.info(
         `Detected zip file at "${absoluteProjectPath}". Unzipping...`,
      );
      const unzippedProjectPath = absoluteProjectPath.replace(".zip", "");
      await fs.promises.rm(unzippedProjectPath, {
         recursive: true,
         force: true,
      });
      await fs.promises.mkdir(unzippedProjectPath, { recursive: true });

      const zip = new AdmZip(absoluteProjectPath);
      zip.extractAllTo(unzippedProjectPath, true);

      return unzippedProjectPath;
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

   private async scaffoldProject(project: ApiProject) {
      const projectName = project.name;
      if (!projectName) {
         throw new Error("Project name is required");
      }
      const absoluteProjectPath = `${publisherPath}/${projectName}`;
      await fs.promises.mkdir(absoluteProjectPath, { recursive: true });
      if (project.readme) {
         await fs.promises.writeFile(
            path.join(absoluteProjectPath, "README.md"),
            project.readme,
         );
      }
      return absoluteProjectPath;
   }

   private async loadProjectIntoDisk(projectName: string, projectPath: string) {
      const absoluteTargetPath = `${publisherPath}/${projectName}`;
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
      if (
         projectPath.startsWith("https://github.com/") ||
         projectPath.startsWith("git@")
      ) {
         try {
            logger.info(`Mounting GitHub path "${projectPath}"`);
            await this.downloadGitHubDirectory(projectPath, absoluteTargetPath);
            return absoluteTargetPath;
         } catch (error) {
            logger.error(`Failed to mount GitHub path "${projectPath}"`, {
               error,
            });
            throw error;
         }
      }

      const errorMsg = `Invalid project path: "${projectPath}". Must be an absolute mounted path or a GCS/S3/GitHub URI.`;
      logger.error(errorMsg, { projectName, projectPath });
      throw new ProjectNotFoundError(errorMsg);
   }

   public async mountLocalDirectory(
      projectPath: string,
      absoluteTargetPath: string,
      projectName: string,
   ) {
      const projectDirExists = (
         await fs.promises.stat(projectPath)
      ).isDirectory();
      if (projectDirExists) {
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

   async downloadGcsDirectory(
      gcsPath: string,
      projectName: string,
      absoluteDirPath: string,
   ) {
      const trimmedPath = gcsPath.slice(5);
      const [bucketName, ...prefixParts] = trimmedPath.split("/");
      const prefix = prefixParts.join("/");
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

   async downloadS3Directory(
      s3Path: string,
      projectName: string,
      absoluteDirPath: string,
   ) {
      const trimmedPath = s3Path.slice(5);
      const [bucketName, ...prefixParts] = trimmedPath.split("/");
      const prefix = prefixParts.join("/");
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

   async downloadGitHubDirectory(githubUrl: string, absoluteDirPath: string) {
      await fs.promises.rm(absoluteDirPath, { recursive: true, force: true });
      await fs.promises.mkdir(absoluteDirPath, { recursive: true });

      await new Promise<void>((resolve, reject) => {
         simpleGit().clone(githubUrl, absoluteDirPath, {}, (err) => {
            if (err) {
               console.error(err);
               logger.error(
                  `Failed to clone GitHub repository "${githubUrl}"`,
                  {
                     error: err,
                  },
               );
               reject(err);
            }
            resolve();
         });
      });
   }
}
