import { URLReader } from "@malloydata/malloy";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const PACKAGE_MANIFEST_NAME = "publisher.json";
export const CONNECTIONS_MANIFEST_NAME = "publisher.connections.json";
export const MODEL_FILE_SUFFIX = ".malloy";
export const NOTEBOOK_FILE_SUFFIX = ".malloynb";
// TODO: Move this to server config.
export const ROW_LIMIT = 1000;

export const URL_READER: URLReader = {
   readURL: (url: URL) => {
      let path = url.toString();
      if (url.protocol == "file:") {
         path = fileURLToPath(url);
      }
      return fs.promises.readFile(path, "utf8");
   },
};

export const isPublisherConfigFrozen = (serverRoot: string) => {
   const publisherConfigPath = path.join(serverRoot, "publisher.config.json");
   if (!fs.existsSync(publisherConfigPath)) {
      return false;
   }
   const publisherConfig = JSON.parse(
      fs.readFileSync(publisherConfigPath, "utf8"),
   );
   return Boolean(publisherConfig.frozenConfig);
};
