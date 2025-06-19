import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import { peerDependencies } from "./package.json";

export default ({ mode }) => {
   return defineConfig({
      define: {
         "process.env.NODE_ENV": JSON.stringify(mode),
         "process.env.NODE_DEBUG": false,
         "process.env.VSCODE_TEXTMATE_DEBUG": false,
      },
      build: {
         minify: mode === "production",
         lib: {
            entry: "./src/index.ts", // Specifies the entry point for building the library.
            name: "@malloy-publisher/sdk", // Sets the name of the generated library.
            fileName: (format) => `index.${format}.js`, // Generates the output file name based on the format.
            formats: ["cjs", "es"], // Specifies the output formats (CommonJS and ES modules).
         },
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
            external: [...Object.keys(peerDependencies)], // Defines external dependencies for Rollup bundling.
            output: {
               manualChunks: {
                  vendor: [
                     "@emotion/react",
                     "@emotion/styled",
                     "@mui/material",
                     "@mui/icons-material",
                     "@mui/system",
                     "@mui/x-tree-view",
                     "@react-spring/web",
                     "@tanstack/react-query",
                     "@uiw/react-md-editor",
                     "axios",
                     "markdown-to-jsx",
                  ],
               },
            },
         },
         sourcemap: mode !== "production",
         emptyOutDir: true, // Clears the output directory before building.
         chunkSizeWarningLimit: 1000,
         target: "es2020",
      },
      plugins: [
         dts({
            outDir: "dist",
            entryRoot: "src",
            include: ["src/**/*.ts", "src/**/*.tsx"],
            exclude: ["src/**/__test__/**", "src/**/__docs__/**"],
            staticImport: true,
            insertTypesEntry: true,
         }),
         svgr(),
         react(),
      ],
   });
};
