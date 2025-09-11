import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default ({ mode }) => {
   const isDev = mode === "development";
   // In Dev, Resolve the SDK locally as src, not /dist so it can hot reload
   // But for CSS files, we need to point to dist since they're only generated during build
   const resolve = {
      alias: {
         // CSS files must come BEFORE the general SDK alias
         "@malloy-publisher/sdk/styles.css": path.resolve(
            __dirname,
            "../sdk/dist/styles.css",
         ),
         "@malloy-publisher/sdk/malloy-explorer.css": path.resolve(
            __dirname,
            "../sdk/dist/malloy-explorer.css",
         ),
         "@malloy-publisher/sdk/markdown-editor.css": path.resolve(
            __dirname,
            "../sdk/dist/markdown-editor.css",
         ),
         "@malloy-publisher/sdk": isDev
            ? // General SDK alias for everything else
              path.resolve(__dirname, "../sdk/src")
            : // In production, use the built SDK to avoid duplicate dependencies
              path.resolve(__dirname, "../sdk/dist/index.es.js"),
      },
   };

   const manualChunks = {
      // React core
      "react-vendor": [
         "react",
         "react-dom",
         "react/jsx-runtime",
         "react-dom/client",
      ],

      // MUI Ecosystem
      "mui-core": ["@mui/material", "@mui/system"],
      "mui-icons": ["@mui/icons-material"],
      "mui-tree": ["@mui/x-tree-view"],

      // Utilities
      "emotion-vendor": ["@emotion/react", "@emotion/styled"],

      // Editor
      "editor-vendor": ["@uiw/react-md-editor", "markdown-to-jsx"],

      // Other large libraries
      "spring-vendor": ["@react-spring/web"],
      "query-vendor": ["@tanstack/react-query"],
   };

   return defineConfig({
      server: isDev
         ? {
              proxy: {
                 "/api/v0": {
                    target: "http://localhost:4000",
                    changeOrigin: true,
                 },
              },
           }
         : {},
      plugins: [react(), dts()],
      define: {
         // This is REQUIRED for React and other libraries to eliminate debug code
         "process.env.NODE_ENV": JSON.stringify(mode),
         "process.env.NODE_DEBUG": "false",
         // Custom defines for your own code (optional)
         __DEV__: JSON.stringify(mode !== "production"),
         __PROD__: JSON.stringify(mode === "production"),
      },
      build: {
         minify: mode === "production",
         sourcemap: mode !== "production",
         emptyOutDir: true,
         chunkSizeWarningLimit: 1000,
         target: "esnext",
         rollupOptions: {
            onwarn(warning, warn) {
               if (
                  warning.code === "MODULE_LEVEL_DIRECTIVE" ||
                  warning.code === "SOURCEMAP_ERROR"
               ) {
                  return;
               }
               warn(warning);
            },
            external: [
               // Malloy dependencies (should be provided by host)
               "@malloydata/malloy-explorer",
               "@malloydata/malloy-interfaces",
               "@malloydata/malloy-query-builder",
               "@malloydata/render",

               // All peer dependencies
               // ...Object.keys(peerDependencies),
            ],
            output: {
               // Provide global variable names for externalized dependencies
               globals: {
                  react: "React",
                  "react-dom": "ReactDOM",
                  "react/jsx-runtime": "ReactJSXRuntime",
                  "@emotion/react": "EmotionReact",
                  "@emotion/styled": "EmotionStyled",
                  "@mui/material": "MaterialUI",
                  "@mui/icons-material": "MaterialUIIcons",
                  "@mui/system": "MaterialUISystem",
               },
               manualChunks,
            },
         },
      },
      resolve,
      // Optimize for faster builds
      optimizeDeps: {
         include: [
            "react",
            "react-dom",
            "@mui/material",
            "@mui/icons-material",
         ],
      },
   });
};
