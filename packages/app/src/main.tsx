import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ConnectionsPage } from "./components/ConnectionsPage";
import { HomePage } from "./components/HomePage";
import MainPage from "./components/MainPage";
import { ModelPage } from "./components/ModelPage";
import { PackagePage } from "./components/PackagePage";
import { ProjectPage } from "./components/ProjectPage";
import { RouteError } from "./components/RouteError";
import { ScratchNotebookPageList } from "./components/ScatchNotebookPageList";
import { ScratchNotebookPage } from "./components/ScratchNotebookPage";
import theme from "./theme";

const server = `${window.location.protocol}//${window.location.host}/api/v0`;
const router = createBrowserRouter([
   {
      path: "/",
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
            element: <HomePage server={server} />,
         },
         {
            path: ":projectName",
            element: <ProjectPage server={server} />,
         },
         {
            path: ":projectName/:packageName",
            element: <PackagePage server={server} />,
         },
         {
            path: ":projectName/:packageName/scratchNotebook",
            element: <ScratchNotebookPage server={server} />,
         },
         {
            path: ":projectName/:packageName/listScratchNotebooks",
            element: <ScratchNotebookPageList server={server} />,
         },
         {
            path: ":projectName/:packageName/*",
            element: <ModelPage server={server} />,
         },
         {
            path: ":projectName/connections/:connectionName",
            element: <ConnectionsPage server={server} />,
         },
      ],
   },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <RouterProvider router={router} />
   </React.StrictMode>,
);
