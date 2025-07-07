import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    process: { env: {} }, // or a more specific mock
  },
  server: {
    proxy: {
      "/api/v0": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    // The dev mode render seems to fail when loading the lazy load malloydata/render
    include: ["@malloydata/render"],
  },
});
