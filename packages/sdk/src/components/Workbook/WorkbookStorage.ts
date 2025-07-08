import { PackageContextProps } from "../Package";

export interface Workspace {
   name: string;
   writeable: boolean;
   description: string;
}

export interface WorkbookLocator {
   path: string;
   workspace: string;
}

export interface WorkbookStorage {
   // Lists all available workspaces for the context.
   listWorkspaces(
      context: PackageContextProps,
      writeableOnly: boolean,
   ): Promise<Workspace[]>;

   // Lists all available workbooks for the context.
   // Workbooks names are like S3 paths- / denote hierarchical
   // folders, but otherwise folders are not "real" objects
   listWorkbooks(
      workspace: Workspace,
      context: PackageContextProps,
   ): Promise<WorkbookLocator[]>;

   // Returns the workbook at the specific path, throws an exception if no such workbook exists (or cannot be accessed)
   getWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
   ): Promise<string>;

   // Deletes the workbook at the specified path, or throws an
   // Exception on failure
   deleteWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
   ): Promise<void>;

   saveWorkbook(
      context: PackageContextProps,
      path: WorkbookLocator,
      workbook: string,
   ): Promise<void>;

   // Moves workbook from the "from" path to the "to" path
   moveWorkbook(
      context: PackageContextProps,
      from: WorkbookLocator,
      to: WorkbookLocator,
   ): Promise<void>;
}
