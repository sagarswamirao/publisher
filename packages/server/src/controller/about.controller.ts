import { components } from "../api";
import { getWorkingDirectory } from "../utils";
import * as fs from "fs/promises";
import * as path from "path";

type ApiAbout = components["schemas"]["About"];

export class AboutController {
   public async getAbout(): Promise<ApiAbout> {
      const workingDirectory = getWorkingDirectory();
      try {
         const readme = (
            await fs.readFile(path.join(workingDirectory, "README.md"))
         ).toString();
         return { readme: readme };
      } catch (error) {
         console.log(error);
         return { readme: "" };
      }
   }
}
