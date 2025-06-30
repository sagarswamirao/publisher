import React, { createContext, useContext, ReactNode } from "react";

export interface PackageContextProps {
   projectName: string;
   packageName: string;
   versionId?: string;
}

const PackageContext = createContext<PackageContextProps | undefined>(
   undefined,
);

interface PackageProviderProps extends PackageContextProps {
   children: ReactNode;
}

// Provider for the Package context.
// This context is used to pass the package information to the components
// that need it.
// The package information is passed to the components via the usePackage hook.
export const PackageProvider = ({
   projectName,
   packageName,
   versionId,
   children,
}: PackageProviderProps) => {
   return (
      <PackageContext.Provider value={{ projectName, packageName, versionId }}>
         {children}
      </PackageContext.Provider>
   );
};

export function usePackage(throwOnMissing: boolean = true) {
   const context = useContext(PackageContext);
   if (!context && throwOnMissing) {
      throw new Error("usePackage must be used within a PackageProvider");
   }
   return context;
}
