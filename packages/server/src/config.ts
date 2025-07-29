import fs from "fs";
import path from "path";
import { PUBLISHER_CONFIG_NAME } from "./constants";

type FilesystemPath = `./${string}` | `../${string}` | `/${string}`;
type GcsPath = `gs://${string}`;
export type PublisherConfig = {
   frozenConfig: boolean;
   projects: Record<string, FilesystemPath | GcsPath>;
};

export const getPublisherConfig = (serverRoot: string): PublisherConfig => {
   const publisherConfigPath = path.join(serverRoot, PUBLISHER_CONFIG_NAME);
   return JSON.parse(fs.readFileSync(publisherConfigPath, "utf8"));
};

export const isPublisherConfigFrozen = (serverRoot: string) => {
   const publisherConfig = getPublisherConfig(serverRoot);
   return Boolean(publisherConfig.frozenConfig);
};
