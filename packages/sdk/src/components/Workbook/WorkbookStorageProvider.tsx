import React, { createContext, useContext, useMemo } from "react";
import type { WorkbookStorage, UserContext } from "./WorkbookStorage";

export interface WorkbookStorageProviderProps {
   children: React.ReactNode;
   userContext: UserContext;
   workbookStorage: WorkbookStorage;
}

interface WorkbookStorageContextValue {
   workbookStorage: WorkbookStorage;
   userContext: UserContext;
}

const WorkbookStorageContext = createContext<
   WorkbookStorageContextValue | undefined
>(undefined);

export default function WorkbookStorageProvider({
   children,
   userContext,
   workbookStorage,
}: WorkbookStorageProviderProps) {
   const value = useMemo(
      () => ({ workbookStorage, userContext }),
      [workbookStorage, userContext],
   );
   return (
      <WorkbookStorageContext.Provider value={value}>
         {children}
      </WorkbookStorageContext.Provider>
   );
}

export function useWorkbookStorage() {
   const context = useContext(WorkbookStorageContext);
   if (!context) {
      throw new Error(
         "useWorkbookStorage must be used within a WorkbookStorageProvider",
      );
   }
   return context;
}
