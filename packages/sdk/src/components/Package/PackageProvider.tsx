import React, { createContext, useContext, ReactNode } from "react";

export interface PackageContextProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   accessToken?: string;
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
   server,
   projectName,
   packageName,
   versionId,
   accessToken,
   children,
}: PackageProviderProps) => {
   return (
      <PackageContext.Provider
         value={{ server, projectName, packageName, versionId, accessToken }}
      >
         {children}
      </PackageContext.Provider>
   );
};

export function usePackage() {
   const context = useContext(PackageContext);
   if (!context) {
      throw new Error("usePackage must be used within a PackageProvider");
   }
   return context;
}
