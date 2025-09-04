import React, {
   createContext,
   useContext,
   PropsWithChildren,
   useMemo,
} from "react";
import { parseResourceUri } from "../../utils/formatting";

export interface PublisherResourceContextProps {
   projectName: string;
   packageName: string;
   versionId?: string;
}

const PublisherResourceContext = createContext<
   PublisherResourceContextProps | undefined
>(undefined);

interface PublisherResourceProviderProps extends PropsWithChildren {
   resourceUri: string;
}

// Provider for the Package context.
// This context is used to pass the package information to the components
// that need it.
// The package information is passed to the components via the usePackage hook.
export const PublisherResourceProvider = ({
   resourceUri,
   children,
}: PublisherResourceProviderProps) => {
   const parsedResourceUri = useMemo(
      () => parseResourceUri(resourceUri),
      [resourceUri],
   );
   return (
      <PublisherResourceContext.Provider
         value={{
            projectName: parsedResourceUri.project,
            packageName: parsedResourceUri.package,
            versionId: parsedResourceUri.version,
         }}
      >
         {children}
      </PublisherResourceContext.Provider>
   );
};

export function usePublisherResource(throwOnMissing: boolean = true) {
   const context = useContext(PublisherResourceContext);
   if (!context && throwOnMissing) {
      throw new Error(
         "usePublisherResource must be used within a PublisherResourceProvider",
      );
   }
   return context;
}
