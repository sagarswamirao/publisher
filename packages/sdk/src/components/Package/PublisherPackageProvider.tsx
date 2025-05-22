import React, { createContext, useContext, ReactNode } from "react";

export interface PublisherPackageContextProps {
   server?: string;
   projectName: string;
   packageName: string;
   versionId?: string;
   accessToken?: string;
}

const PublisherPackageContext = createContext<
   PublisherPackageContextProps | undefined
>(undefined);

interface PublisherPackageProviderProps extends PublisherPackageContextProps {
   children: ReactNode;
}

// Provider for the Publisher Package context.
// This context is used to pass the package information to the components
// that need it.
// The package information is passed to the components via the usePublisherPackage hook.
export const PublisherPackageProvider = ({
   server,
   projectName,
   packageName,
   versionId,
   accessToken,
   children,
}: PublisherPackageProviderProps) => {
   return (
      <PublisherPackageContext.Provider
         value={{ server, projectName, packageName, versionId, accessToken }}
      >
         {children}
      </PublisherPackageContext.Provider>
   );
};

export function usePublisherPackage() {
   const context = useContext(PublisherPackageContext);
   if (!context) {
      throw new Error(
         "usePublisherPackage must be used within a PublisherPackageProvider",
      );
   }
   return context;
}
