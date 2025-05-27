import type { NotebookStorage, UserContext } from "./NotebookStorage";

export class BrowserNotebookStorage implements NotebookStorage {
   private makeKey(context: UserContext, path?: string): string {
      let key = `BROWSER_NOTEBOOK_STORAGE__${context.project}/${context.package}`;
      if (path) {
         key += `/${path}`;
      }
      return key;
   }

   listNotebooks(context: UserContext): string[] {
      const prefix = this.makeKey(context);
      const keys: string[] = [];
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

   getNotebook(context: UserContext, path: string): string {
      const key = this.makeKey(context, path);
      const notebook = localStorage.getItem(key);
      if (notebook === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      return notebook;
   }

   deleteNotebook(context: UserContext, path: string): void {
      const key = this.makeKey(context, path);
      if (localStorage.getItem(key) === null) {
         throw new Error(`Notebook not found at path: ${path}`);
      }
      localStorage.removeItem(key);
   }

   saveNotebook(context: UserContext, path: string, notebook: string): void {
      const key = this.makeKey(context, path);
      localStorage.setItem(key, notebook);
   }

   moveNotebook(context: UserContext, from: string, to: string): void {
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
