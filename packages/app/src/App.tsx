import { ServerProvider } from "@malloy-publisher/sdk";
import "@malloydata/malloy-explorer/styles.css";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./components/HomePage";
import MainPage from "./components/MainPage";
import { ModelPage } from "./components/ModelPage";
import { PackagePage } from "./components/PackagePage";
import { ProjectPage } from "./components/ProjectPage";
import { RouteError } from "./components/RouteError";
import { ScratchNotebookPage } from "./components/ScratchNotebookPage";
import theme from "./theme";

// Create router configuration function
export const createMalloyRouter = (basePath: string = "/") => {
   return createBrowserRouter([
      {
         path: basePath,
         element: (
            <ThemeProvider theme={theme}>
               <CssBaseline />
               <MainPage />
            </ThemeProvider>
         ),
         errorElement: <RouteError />,
         children: [
            {
               path: "",
               element: <HomePage />,
            },
            {
               path: ":projectName",
               element: <ProjectPage />,
            },
            {
               path: ":projectName/:packageName",
               element: <PackagePage />,
            },
            {
               path: ":projectName/:packageName/*",
               element: <ModelPage />,
            },
            {
               path: ":projectName/:packageName/scratchNotebook/:notebookPath",
               element: <ScratchNotebookPage />,
            },
         ],
      },
   ]);
};

export interface MalloyPublisherAppProps {
   server?: string;
   accessToken?: string;
   basePath?: string;
}

export const MalloyPublisherApp: React.FC<MalloyPublisherAppProps> = ({
   server,
   accessToken,
   basePath = "/",
}) => {
   const router = createMalloyRouter(basePath);
   return (
      <ServerProvider server={server} accessToken={accessToken}>
         <RouterProvider router={router} />
      </ServerProvider>
   );
};
