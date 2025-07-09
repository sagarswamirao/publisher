import { PackageContextProps } from "../Package";
import type {
   WorkbookLocator,
   WorkbookStorage,
   Workspace,
} from "./WorkbookStorage";

const LOCAL_WORKSPACE_NAME = "Local";

export class BrowserWorkbookStorage implements WorkbookStorage {
   private makeKey(context: PackageContextProps, path?: string): string {
      let key = `BROWSER_NOTEBOOK_STORAGE/${context.projectName}/${context.packageName}`;
      if (path) {
         key += `/${path}`;
      }
      return key;
   }

   async listWorkspaces(
      context: PackageContextProps,
      writeableOnly: boolean,
   ): Promise<Workspace[]> {
      // Parameters not used in browser storage implementation
      void context;
      void writeableOnly;
      return [
         {
            name: LOCAL_WORKSPACE_NAME,
            description: "Stored locally- only accessible to this browser",
            writeable: true,
         },
      ];
   }

   async listWorkbooks(
      workspace: Workspace,
      context: PackageContextProps,
   ): Promise<WorkbookLocator[]> {
      const prefix = this.makeKey(context);
      const keys: WorkbookLocator[] = [];
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith(prefix + "/")) {
            // Extract the notebook path after the prefix
            const notebookPath = key.substring(prefix.length + 1);
            keys.push({ path: notebookPath, workspace: LOCAL_WORKSPACE_NAME });
         }
      }
      return keys;
   }

   async getWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
   ): Promise<string> {
      const key = this.makeKey(context, path.path);
      const notebook = localStorage.getItem(key);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      return notebook;
   }

   async deleteWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
   ): Promise<void> {
      const key = this.makeKey(context, path.path);
      if (localStorage.getItem(key) === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      localStorage.removeItem(key);
   }

   async saveWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
      notebook: string,
   ): Promise<void> {
      console.log("saveWorkbook", context, path, notebook);
      const key = this.makeKey(context, path.path);
      console.log("saveWorkbook", key);
      localStorage.setItem(key, notebook);
   }

   async moveWorkbook(
      context: PackageContextProps,
      from: WorkbookLocator,
      to: WorkbookLocator,
   ): Promise<void> {
      const fromKey = this.makeKey(context, from.path);
      const toKey = this.makeKey(context, to.path);
      const notebook = localStorage.getItem(fromKey);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${from.path}`);
      }
      localStorage.setItem(toKey, notebook);
      localStorage.removeItem(fromKey);
   }
}
