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
import { HeaderProps } from "./components/Header";

// Create router configuration function
export const createMalloyRouter = (
   basePath: string = "/",
   headerProps?: HeaderProps,
) => {
   return createBrowserRouter([
      {
         path: basePath,
         element: (
            <ThemeProvider theme={theme}>
               <CssBaseline />
               <MainPage headerProps={headerProps} />
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
   headerProps: HeaderProps;
}

export const MalloyPublisherApp: React.FC<MalloyPublisherAppProps> = ({
   server,
   accessToken,
   basePath = "/",
   headerProps,
}) => {
   const router = createMalloyRouter(basePath, headerProps);
   return (
      <ServerProvider server={server} accessToken={accessToken}>
         <RouterProvider router={router} />
      </ServerProvider>
   );
};
