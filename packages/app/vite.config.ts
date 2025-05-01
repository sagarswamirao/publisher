import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// https://vitejs.dev/config/
export default ({ mode }) => {
   return defineConfig({
      plugins: [react()],
      define: {
         "process.env": JSON.stringify(mode),
      },
      // Resolve the SDK locally as src, not /dist so it can hot reload
      resolve: {
         alias: {
             '@malloy-publisher/sdk': path.resolve(__dirname, '../sdk/src'),
         },
     },
   });
};
