import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "./theme";
import MainPage from "./components/MainPage";
import { HomePage } from "./components/HomePage";
import { RouteError } from "./components/RouteError";
import { PackagePage } from "./components/PackagePage";
import { ProjectPage } from "./components/ProjectPage";
import { ModelPage } from "./components/ModelPage";
import { ConnectionsPage } from "./components/ConnectionsPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ScratchNotebookPage } from "./components/ScratchNotebookPage";
import { ScratchNotebookPageList } from "./components/ScatchNotebookPageList";

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
            path: ":projectName/:packageName/scratch_notebook",
            element: <ScratchNotebookPage server={server} />,
         },
         {
            path: ":projectName/:packageName/list_scratch_notebook",
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
