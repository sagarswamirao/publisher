import { URLReader } from "@malloydata/malloy";
import * as fs from "fs";
import { fileURLToPath } from "url";

export const URL_READER: URLReader = {
   readURL: (url: URL) => {
      let path = url.toString();
      if (url.protocol == "file:") {
         path = fileURLToPath(url);
      }
      return fs.promises.readFile(path, "utf8");
   },
};
