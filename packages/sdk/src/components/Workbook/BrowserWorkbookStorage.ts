import { PackageContextProps } from "../Package";
import type { WorkbookStorage } from "./WorkbookStorage";

export class BrowserWorkbookStorage implements WorkbookStorage {
   private makeKey(context: PackageContextProps, path?: string): string {
      let key = `BROWSER_NOTEBOOK_STORAGE__${context.projectName}/${context.packageName}`;
      if (path) {
         key += `/${path}`;
      }
      return key;
   }

   async listWorkbooks(context: PackageContextProps): Promise<string[]> {
      const prefix = this.makeKey(context);
      const keys: string[] = [];
      console.log("prefix", prefix);
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith(prefix + "/")) {
            // Extract the notebook path after the prefix
            const notebookPath = key.substring(prefix.length + 1);
            keys.push(notebookPath);
         }
      }
      return keys;
   }

   async getWorkbook(
      context: PackageContextProps,
      path: string,
   ): Promise<string> {
      const key = this.makeKey(context, path);
      const notebook = localStorage.getItem(key);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      return notebook;
   }

   async deleteWorkbook(
      context: PackageContextProps,
      path: string,
   ): Promise<void> {
      const key = this.makeKey(context, path);
      if (localStorage.getItem(key) === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      localStorage.removeItem(key);
   }

   async saveWorkbook(
      context: PackageContextProps,
      path: string,
      notebook: string,
   ): Promise<void> {
      const key = this.makeKey(context, path);
      localStorage.setItem(key, notebook);
   }

   async moveWorkbook(
      context: PackageContextProps,
      from: string,
      to: string,
   ): Promise<void> {
      const fromKey = this.makeKey(context, from);
      const toKey = this.makeKey(context, to);
      const notebook = localStorage.getItem(fromKey);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${from}`);
      }
      localStorage.setItem(toKey, notebook);
      localStorage.removeItem(fromKey);
   }
}
