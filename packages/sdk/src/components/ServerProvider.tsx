import React, { createContext, useContext, ReactNode } from "react";

export interface ServerContextValue {
   server: string;
   accessToken?: string;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export interface ServerProviderProps {
   server?: string;
   accessToken?: string;
   children: ReactNode;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({
   server = `${window.location.protocol}//${window.location.host}/api/v0`,
   accessToken,
   children,
}) => {
   const value: ServerContextValue = {
      server,
      accessToken,
   };

   return (
      <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
   );
};

export const useServer = (): ServerContextValue => {
   const context = useContext(ServerContext);
   if (context === undefined) {
      throw new Error("useServer must be used within a ServerProvider");
   }
   return context;
};
