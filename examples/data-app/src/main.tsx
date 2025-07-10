import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "./theme";
import AppShell from "./AppShell";
import { ServerProvider } from "@malloy-publisher/sdk";
// Import required CSS
import "@malloy-publisher/sdk/styles.css";

const apiUrl = import.meta.env.VITE_PUBLISHER_API;
const getAccessToken = async (): Promise<string> => {
  return ""; // would replace with real auth logic when needed
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ServerProvider server={apiUrl} getAccessToken={getAccessToken}>
        <AppShell />
      </ServerProvider>
    </ThemeProvider>
  </React.StrictMode>
);
