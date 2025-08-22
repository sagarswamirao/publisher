import fs from "fs";
export const API_PREFIX = "/api/v0";
export const README_NAME = "README.md";
export const PUBLISHER_CONFIG_NAME = "publisher.config.json";
export const PACKAGE_MANIFEST_NAME = "publisher.json";
export const CONNECTIONS_MANIFEST_NAME = "publisher.connections.json";
export const MODEL_FILE_SUFFIX = ".malloy";
export const NOTEBOOK_FILE_SUFFIX = ".malloynb";
export const ROW_LIMIT = 1000;

export let publisherPath = "/etc/publisher";
try {
   fs.accessSync(publisherPath, fs.constants.W_OK);
} catch {
   publisherPath = "/tmp/publisher";
}
