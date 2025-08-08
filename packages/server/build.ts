import { build } from "bun";
import fs from "fs";

fs.rmSync("./dist", { recursive: true, force: true });
fs.mkdirSync("./dist");

await build({
   entrypoints: ["./src/server.ts", "./src/instrumentation.ts"],
   outdir: "./dist",
   target: "node",
   format: "cjs",
   external: [
      "@malloydata/db-duckdb",
      "@malloydata/malloy",
      "@malloydata/malloy-sql",
      "@malloydata/render",
      "@malloydata/db-bigquery",
      "@malloydata/db-mysql",
      "@malloydata/db-postgres",
      "@malloydata/db-snowflake",
      "@malloydata/db-trino",
      "@google-cloud/storage",
   ],
});

fs.cpSync("../app/dist", "./dist/app", { recursive: true });
