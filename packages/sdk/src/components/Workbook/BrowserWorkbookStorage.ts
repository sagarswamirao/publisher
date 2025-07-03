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

   listWorkbooks(context: PackageContextProps): string[] {
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

   getWorkbook(context: PackageContextProps, path: string): string {
      const key = this.makeKey(context, path);
      const notebook = localStorage.getItem(key);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      return notebook;
   }

   deleteWorkbook(context: PackageContextProps, path: string): void {
      const key = this.makeKey(context, path);
      if (localStorage.getItem(key) === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      localStorage.removeItem(key);
   }

   saveWorkbook(
      context: PackageContextProps,
      path: string,
      notebook: string,
   ): void {
      const key = this.makeKey(context, path);
      localStorage.setItem(key, notebook);
   }

   moveWorkbook(context: PackageContextProps, from: string, to: string): void {
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
