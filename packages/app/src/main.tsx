import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ServerProvider } from "@malloy-publisher/sdk";
import { createMalloyRouter } from "./App";

const server = `${window.location.protocol}//${window.location.host}/api/v0`;
const router = createMalloyRouter("/");

ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <ServerProvider server={server}>
         <RouterProvider router={router} />
      </ServerProvider>
   </React.StrictMode>,
);
