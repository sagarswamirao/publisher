import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";
import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import simpleGit from "simple-git";
import { Writable } from "stream";
import { components } from "../api";
import { getPublisherConfig, isPublisherConfigFrozen } from "../config";
import {
   API_PREFIX,
   CONNECTIONS_MANIFEST_NAME,
   PUBLISHER_CONFIG_NAME,
   publisherPath,
} from "../constants";
import {
   FrozenConfigError,
   PackageNotFoundError,
   ProjectNotFoundError,
} from "../errors";
import { logger } from "../logger";
import { Project } from "./project";
type ApiProject = components["schemas"]["Project"];

export class ProjectStore {
   public serverRootPath: string;
   private projects: Map<string, Project> = new Map();
   public publisherConfigIsFrozen: boolean;
   public finishedInitialization: Promise<void>;
   private isInitialized: boolean = false;
   private s3Client = new S3({
      followRegionRedirects: true,
   });
   private gcsClient: Storage;

   constructor(serverRootPath: string) {
      this.serverRootPath = serverRootPath;
      this.gcsClient = new Storage();

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
            projectManifest.projects.map(async (project) => {
               logger.info(`Adding project "${project.name}"`);
               const projectInstance = await this.addProject(
                  {
                     name: project.name,
                     resource: `${API_PREFIX}/projects/${project.name}`,
                  },
                  true,
               );
               return projectInstance.listPackages();
            }),
         );
         this.isInitialized = true;
         logger.info(
            `Project store successfully initialized in ${performance.now() - initialTime}ms`,
         );
      } catch (error) {
         logger.error("Error initializing project store", { error });
         console.error(error);
         process.exit(1);
      }
   }

   public async listProjects(skipInitializationCheck: boolean = false) {
      if (!skipInitializationCheck) {
         await this.finishedInitialization;
      }
      return Promise.all(
         Array.from(this.projects.values()).map((project) =>
            project.serialize(),
         ),
      );
   }

   public async getStatus() {
      const status = {
         timestamp: Date.now(),
         projects: [] as Array<components["schemas"]["Project"]>,
         initialized: this.isInitialized,
      };

      const projects = await this.listProjects(true);

      await Promise.all(
         projects.map(async (project) => {
            try {
               const packages = project.packages;
               const connections = project.connections;

               logger.info(`Project ${project.name} status:`, {
                  connectionsCount: project.connections?.length || 0,
                  packagesCount: packages?.length || 0,
               });

               const _connections = connections?.map((connection) => {
                  return {
                     ...connection,
                     attributes: undefined,
                  };
               });

               const _project = {
                  ...project,
                  connections: _connections,
               };
               project.connections = _connections;
               status.projects.push(_project);
            } catch (error) {
               logger.error("Error listing packages and connections", {
                  error,
               });
               throw new Error(
                  "Error listing packages and connections: " + error,
               );
            }
         }),
      );
      return status;
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
         const projectConfig = projectManifest.projects.find(
            (p) => p.name === projectName,
         );
         const projectPath =
            project?.metadata.location || projectConfig?.packages[0]?.location;
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

      // Check if project already exists and update it instead of creating a new one
      const existingProject = this.projects.get(projectName);
      if (existingProject) {
         logger.info(`Project ${projectName} already exists, updating it`);
         const updatedProject = await existingProject.update(project);
         this.projects.set(projectName, updatedProject);
         return updatedProject;
      }

      const projectManifest = await ProjectStore.reloadProjectManifest(
         this.serverRootPath,
      );
      const projectConfig = projectManifest.projects.find(
         (p) => p.name === projectName,
      );

      const hasPackages =
         (project?.packages && project.packages.length > 0) ||
         (projectConfig?.packages && projectConfig.packages.length > 0);
      let absoluteProjectPath: string;
      if (hasPackages) {
         const packagesToProcess =
            project?.packages || projectConfig?.packages || [];
         absoluteProjectPath = await this.loadProjectIntoDisk(
            projectName,
            projectName,
            packagesToProcess,
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
         return;
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
            return { projects: [] };
         } else {
            // If publisher.config.json is missing, generate the manifest from directories
            try {
               const entries = await fs.promises.readdir(serverRootPath, {
                  withFileTypes: true,
               });
               const projects: {
                  name: string;
                  packages: {
                     name: string;
                     location: string;
                  }[];
               }[] = [];
               for (const entry of entries) {
                  if (entry.isDirectory()) {
                     projects.push({
                        name: entry.name,
                        packages: [
                           {
                              name: entry.name,
                              location: entry.name,
                           },
                        ],
                     });
                  }
               }
               return { projects };
            } catch (lsError) {
               logger.error(`Error listing directories in ${serverRootPath}`, {
                  error: lsError,
               });
               return { projects: [] };
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

   private async loadProjectIntoDisk(
      projectName: string,
      projectPath: string,
      packages: ApiProject["packages"],
   ) {
      const absoluteTargetPath = `${publisherPath}/${projectPath}`;

      if (!packages || packages.length === 0) {
         throw new PackageNotFoundError(
            `No packages found for project ${projectName}`,
         );
      }

      // Group packages by location to optimize downloads
      const locationGroups = new Map<
         string,
         Array<{ name: string; location: string }>
      >();

      for (const _package of packages) {
         if (!_package.name) {
            throw new PackageNotFoundError(`Package has no name specified`);
         }

         if (!_package.location) {
            throw new PackageNotFoundError(
               `Package ${_package.name} has no location specified`,
            );
         }

         const location = _package.location;
         const packageName = _package.name;

         if (!locationGroups.has(location)) {
            locationGroups.set(location, []);
         }
         locationGroups.get(location)!.push({ name: packageName, location });
      }

      // Processing by each unique location
      for (const [location, packagesForLocation] of locationGroups) {
         // Create a temporary directory for the shared download
         const tempDownloadPath = `${absoluteTargetPath}/.temp_${Buffer.from(
            location,
         )
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")}`;
         await fs.promises.mkdir(tempDownloadPath, { recursive: true });

         try {
            // Download the entire location once
            await this.downloadOrMountLocation(
               location,
               tempDownloadPath,
               projectName,
               "shared",
            );

            // Extract each package from the downloaded content
            for (const _package of packagesForLocation) {
               const packageDir = _package.name;
               const absolutePackagePath = `${absoluteTargetPath}/${packageDir}`;

               // Check if the package directory exists in the downloaded content
               const packagePathInDownload = path.join(
                  tempDownloadPath,
                  packageDir,
               );
               const packageExists = await fs.promises
                  .access(packagePathInDownload)
                  .then(() => true)
                  .catch(() => false);

               if (packageExists) {
                  // Copy the specific package directory
                  await fs.promises.mkdir(absolutePackagePath, {
                     recursive: true,
                  });
                  await fs.promises.cp(
                     packagePathInDownload,
                     absolutePackagePath,
                     { recursive: true },
                  );
                  logger.info(
                     `Extracted package "${packageDir}" from shared download`,
                  );
               } else {
                  // If package directory doesn't exist, copy the entire download as the package
                  // This handles cases where the location itself is the package
                  await fs.promises.mkdir(absolutePackagePath, {
                     recursive: true,
                  });
                  await fs.promises.cp(tempDownloadPath, absolutePackagePath, {
                     recursive: true,
                  });
                  logger.info(
                     `Copied entire download as package "${packageDir}"`,
                  );
               }
            }

            const connectionsFileInDownload = path.join(
               tempDownloadPath,
               CONNECTIONS_MANIFEST_NAME,
            );
            const connectionsFileInProject = path.join(
               absoluteTargetPath,
               CONNECTIONS_MANIFEST_NAME,
            );

            try {
               await fs.promises.access(
                  connectionsFileInDownload,
                  fs.constants.F_OK,
               );
               await fs.promises.cp(
                  connectionsFileInDownload,
                  connectionsFileInProject,
               );
               logger.info(
                  `Copied ${CONNECTIONS_MANIFEST_NAME} to project directory`,
               );
            } catch (error) {
               console.error(error);
               logger.info(`No ${CONNECTIONS_MANIFEST_NAME} found`);
            }
         } finally {
            // Clean up temporary download directory
            await fs.promises.rm(tempDownloadPath, {
               recursive: true,
               force: true,
            });
         }
      }

      return absoluteTargetPath;
   }

   private async downloadOrMountLocation(
      location: string,
      targetPath: string,
      projectName: string,
      packageName: string,
   ) {
      // Handle GCS paths
      if (location.startsWith("gs://")) {
         try {
            logger.info(
               `Downloading GCS directory from "${location}" to "${targetPath}"`,
            );
            await this.downloadGcsDirectory(location, projectName, targetPath);
            return;
         } catch (error) {
            logger.error(`Failed to download GCS directory "${location}"`, {
               error,
            });
            throw new PackageNotFoundError(
               `Failed to download GCS directory: ${location}`,
            );
         }
      }

      // Handle GitHub URLs
      if (
         location.startsWith("https://github.com/") ||
         location.startsWith("git@")
      ) {
         try {
            logger.info(
               `Cloning GitHub repository from "${location}" to "${targetPath}"`,
            );
            await this.downloadGitHubDirectory(location, targetPath);
            return;
         } catch (error) {
            logger.error(`Failed to clone GitHub repository "${location}"`, {
               error,
            });
            throw new PackageNotFoundError(
               `Failed to clone GitHub repository: ${location}`,
            );
         }
      }

      // Handle S3 paths
      if (location.startsWith("s3://")) {
         try {
            logger.info(
               `Downloading S3 directory from "${location}" to "${targetPath}"`,
            );
            await this.downloadS3Directory(location, projectName, targetPath);
            return;
         } catch (error) {
            logger.error(`Failed to download S3 directory "${location}"`, {
               error,
            });
            throw new PackageNotFoundError(
               `Failed to download S3 directory: ${location}`,
            );
         }
      }

      // Handle absolute paths
      if (path.isAbsolute(location)) {
         try {
            logger.info(
               `Mounting local directory at "${location}" to "${targetPath}"`,
            );
            await this.mountLocalDirectory(
               location,
               targetPath,
               projectName,
               packageName,
            );
            return;
         } catch (error) {
            logger.error(`Failed to mount local directory "${location}"`, {
               error,
            });
            throw new PackageNotFoundError(
               `Failed to mount local directory: ${location}`,
            );
         }
      }

      // If we get here, the path format is not supported
      const errorMsg = `Invalid package path: "${location}". Must be an absolute mounted path or a GCS/S3/GitHub URI.`;
      logger.error(errorMsg, { projectName, location });
      throw new PackageNotFoundError(errorMsg);
   }

   public async mountLocalDirectory(
      projectPath: string,
      absoluteTargetPath: string,
      projectName: string,
      packageName: string,
   ) {
      if (projectPath.endsWith(".zip")) {
         projectPath = await this.unzipProject(projectPath);
      }
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
         throw new PackageNotFoundError(
            `Package ${packageName} for project ${projectName} not found in "${projectPath}"`,
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
