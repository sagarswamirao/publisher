import fs from "fs";
import path from "path";
import { PUBLISHER_CONFIG_NAME } from "./constants";

type FilesystemPath = `./${string}` | `../${string}` | `/${string}`;
type GcsPath = `gs://${string}`;

export type Package = {
   name: string;
   location: FilesystemPath | GcsPath;
};

export type Project = {
   name: string;
   packages: Package[];
};

export type PublisherConfig = {
   frozenConfig: boolean;
   projects: Project[];
};

export const getPublisherConfig = (serverRoot: string): PublisherConfig => {
   const publisherConfigPath = path.join(serverRoot, PUBLISHER_CONFIG_NAME);
   const rawConfig = JSON.parse(fs.readFileSync(publisherConfigPath, "utf8"));

   if (
      rawConfig.projects &&
      typeof rawConfig.projects === "object" &&
      !Array.isArray(rawConfig.projects)
   ) {
      throw new Error(
         "Config has changed. Please update your config to the new format.",
      );
   }

   return rawConfig as PublisherConfig;
};

export const isPublisherConfigFrozen = (serverRoot: string) => {
   const publisherConfig = getPublisherConfig(serverRoot);
   return Boolean(publisherConfig.frozenConfig);
};
