import React, { createContext, useContext, useMemo } from "react";
import type { NotebookStorage, UserContext } from "./NotebookStorage";

interface NotebookStorageProviderProps {
   children: React.ReactNode;
   userContext: UserContext;
   notebookStorage: NotebookStorage;
}

interface NotebookStorageContextValue {
   notebookStorage: NotebookStorage;
   userContext: UserContext;
}

const NotebookStorageContext = createContext<
   NotebookStorageContextValue | undefined
>(undefined);

export default function NotebookStorageProvider({
   children,
   userContext,
   notebookStorage,
}: NotebookStorageProviderProps) {
   const value = useMemo(
      () => ({ notebookStorage, userContext }),
      [notebookStorage, userContext],
   );
   return (
      <NotebookStorageContext.Provider value={value}>
         {children}
      </NotebookStorageContext.Provider>
   );
}

export function useNotebookStorage() {
   const context = useContext(NotebookStorageContext);
   if (!context) {
      throw new Error(
         "useNotebookStorage must be used within a NotebookStorageProvider",
      );
   }
   return context;
}
