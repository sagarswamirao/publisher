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
}

const getApiClients = () => {
   const basePath = `${window.location.protocol}//${window.location.host}/api/v0`;

   // Create a custom axios instance with proper configuration
   const axiosInstance = axios.create({
      baseURL: basePath,
      withCredentials: true,
   });

   const config = new Configuration({
      basePath,
      accessToken: () => "",
   });

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

export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
   const apiClients = useMemo(getApiClients, []);

   const value: ServerContextValue = {
      server: `${window.location.protocol}//${window.location.host}/api/v0`,
      getAccessToken: () => Promise.resolve(""),
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

export const useApiClients = (): ApiClients => {
   const { apiClients } = useServer();
   return apiClients;
};
