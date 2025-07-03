export interface UserContext {
   // UserContext holds the project & package associated with
   // the notebook. PublisherStorage interfaces will
   // implement this and add data representing configuration,
   // user permissions, and access tokens.
   project: string;
   package: string;
}

export interface WorkbookStorage {
   // Lists all available workbooks for the context.
   // Workbooks names are like S3 paths- / denote hierarchical
   // folders, but otherwise folders are not "real" objects
   listWorkbooks(context: UserContext): string[];

   // Returns the workbook at the specific path, throws an exception if no such workbook exists (or cannot be accessed)
   getWorkbook(context: UserContext, path: string): string;

   // Deletes the workbook at the specified path, or throws an
   // Exception on failure
   deleteWorkbook(context: UserContext, path: string): void;

   saveWorkbook(context: UserContext, path: string, workbook: string): void;

   // Moves workbook from the "from" path to the "to" path
   moveWorkbook(context: UserContext, from: string, to: string): void;
}
