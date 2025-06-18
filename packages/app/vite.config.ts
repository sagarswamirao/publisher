import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";

// https://vitejs.dev/config/
export default ({ mode }) => {
   const isDev = mode === "development";
   // In Dev, Resolve the SDK locally as src, not /dist so it can hot reload
   const resolve = isDev
      ? {
           alias: {
              "@malloy-publisher/sdk": path.resolve(__dirname, "../sdk/src"),
           },
        }
      : undefined;

   // Check if we're building as a library
   const isLibraryBuild = process.env.BUILD_MODE === "library";

   if (isLibraryBuild) {
      return defineConfig({
         plugins: [react(), dts()],
         define: {
            "process.env": JSON.stringify(mode),
         },
         resolve,
         build: {
            lib: {
               entry: path.resolve(__dirname, "src/index.ts"),
               name: "MalloyPublisherApp",
               fileName: (format) =>
                  format === "es" ? "index.es.js" : "index.cjs.js",
               formats: ["es", "cjs"],
            },
            rollupOptions: {
               external: ["react", "react-dom"],
               output: {
                  globals: {
                     react: "React",
                     "react-dom": "ReactDOM",
                  },
               },
            },
         },
      });
   }

   return defineConfig({
      plugins: [react()],
      define: {
         "process.env": JSON.stringify(mode),
      },
      resolve,
   });
};
