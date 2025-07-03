import { ServerProvider } from "@malloy-publisher/sdk";
import "@malloydata/malloy-explorer/styles.css";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HeaderProps } from "./components/Header";
import HomePage from "./components/HomePage";
import MainPage from "./components/MainPage";
import { ModelPage } from "./components/ModelPage";
import { PackagePage } from "./components/PackagePage";
import { ProjectPage } from "./components/ProjectPage";
import { RouteError } from "./components/RouteError";
import { WorkbookPage } from "./components/WorkbookPage";
import theme from "./theme";

// Create router configuration function
export const createMalloyRouter = (
   basePath: string = "/",
   headerProps?: HeaderProps,
   server?: string,
   getAccessToken?: () => Promise<string>,
) => {
   return createBrowserRouter([
      {
         path: basePath,
         element: (
            <ServerProvider server={server} getAccessToken={getAccessToken}>
               <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <MainPage headerProps={headerProps} />
               </ThemeProvider>
            </ServerProvider>
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
               path: ":projectName/:packageName/workbook/:workbookPath",
               element: <WorkbookPage />,
            },
         ],
      },
   ]);
};

export interface MalloyPublisherAppProps {
   server?: string;
   getAccessToken?: () => Promise<string>;
   basePath?: string;
   headerProps: HeaderProps;
}

export const MalloyPublisherApp: React.FC<MalloyPublisherAppProps> = ({
   server,
   getAccessToken,
   basePath = "/",
   headerProps,
}) => {
   const router = createMalloyRouter(
      basePath,
      headerProps,
      server,
      getAccessToken,
   );
   return <RouterProvider router={router} />;
};
