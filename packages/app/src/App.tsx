import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ServerProvider } from "@malloy-publisher/sdk";
import { HomePage } from "./components/HomePage";
import MainPage from "./components/MainPage";
import { ModelPage } from "./components/ModelPage";
import { PackagePage } from "./components/PackagePage";
import { ProjectPage } from "./components/ProjectPage";
import { RouteError } from "./components/RouteError";
import { ScratchNotebookPage } from "./components/ScratchNotebookPage";
import theme from "./theme";
import "@malloydata/malloy-explorer/styles.css";

// Create router configuration function
export const createMalloyRouter = (
   basePath: string = "/",
   showHeader: boolean = true,
) => {
   return createBrowserRouter([
      {
         path: basePath,
         element: (
            <ThemeProvider theme={theme}>
               <CssBaseline />
               <MainPage showHeader={showHeader} />
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
   showHeader?: boolean;
}

export const MalloyPublisherApp: React.FC<MalloyPublisherAppProps> = ({
   server,
   accessToken,
   basePath = "/",
   showHeader = true,
}) => {
   const router = createMalloyRouter(basePath, showHeader);
   return (
      <ServerProvider server={server} accessToken={accessToken}>
         <RouterProvider router={router} />
      </ServerProvider>
   );
};
