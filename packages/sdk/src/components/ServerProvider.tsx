import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { Configuration } from "../client/configuration";
import {
   QueryresultsApi,
   ModelsApi,
   ProjectsApi,
   PackagesApi,
   NotebooksApi,
   ConnectionsApi,
   DatabasesApi,
   SchedulesApi,
   WatchModeApi,
} from "../client";
import axios from "axios";

export interface ServerContextValue {
   server: string;
   getAccessToken?: () => Promise<string>;
   apiClients: ApiClients;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export interface ServerProviderProps {
   children: ReactNode;
   /** An optional alternative base URL of the Publisher server. */
   baseURL?: string;
   /** An optional function to get an access token.
    *
    * @example
    * ```ts
    * <ServerProvider getAccessToken={async () => "Bearer 123"}>
    * ```
    * Will send "Bearer 123" in the Authorization header.
    */
   getAccessToken?: () => Promise<string>;
}

const getApiClients = (
   baseURL?: string,
   accessToken?: () => Promise<string>,
) => {
   const basePath = `${window.location.protocol}//${window.location.host}/api/v0`;

   // Create a custom axios instance with proper configuration
   const axiosInstance = axios.create({
      baseURL: baseURL || basePath,
      withCredentials: true,
   });

   axiosInstance.interceptors.request.use(async (config) => {
      config.headers.Authorization = (await accessToken?.()) ?? "";
      return config;
   });

   const config = new Configuration({ basePath });

   return {
      queryResults: new QueryresultsApi(config, basePath, axiosInstance),
      models: new ModelsApi(config, basePath, axiosInstance),
      projects: new ProjectsApi(config, basePath, axiosInstance),
      packages: new PackagesApi(config, basePath, axiosInstance),
      notebooks: new NotebooksApi(config, basePath, axiosInstance),
      connections: new ConnectionsApi(config, basePath, axiosInstance),
      databases: new DatabasesApi(config, basePath, axiosInstance),
      schedules: new SchedulesApi(config, basePath, axiosInstance),
      watchMode: new WatchModeApi(config, basePath, axiosInstance),
   };
};

export type ApiClients = ReturnType<typeof getApiClients>;

export const ServerProvider: React.FC<ServerProviderProps> = ({
   children,
   getAccessToken,
   baseURL,
}) => {
   const apiClients = useMemo(
      () => getApiClients(baseURL, getAccessToken),
      [baseURL, getAccessToken],
   );

   const value: ServerContextValue = {
      server:
         baseURL ||
         `${window.location.protocol}//${window.location.host}/api/v0`,
      getAccessToken,
      apiClients,
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
