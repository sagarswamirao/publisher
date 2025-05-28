export interface UserContext {
   // UserContext holds the project & package associated with
   // the notebook. PublisherStorage interfaces will
   // implement this and add data representing configuration,
   // user permissions, and access tokens.
   project: string;
   package: string;
}

export interface NotebookStorage {
   // Lists all available notebooks for the context.
   // Notebooks names are like S3 paths- / denote hierarchical
   // folders, but otherwise folders are not "real" objects
   listNotebooks(context: UserContext): string[];

   // Returns the notebook at the specific path, throws an exception if no such notebook exists (or cannot be accessed)
   getNotebook(context: UserContext, path: string): string;

   // Deletes the notebook at the specified path, or throws an
   // Exception on failure
   deleteNotebook(context: UserContext, path: string): void;

   saveNotebook(context: UserContext, path: string, notebook: string): void;

   // Moves notebook from the "from" path to the "to" path
   moveNotebook(context: UserContext, from: string, to: string): void;
}
