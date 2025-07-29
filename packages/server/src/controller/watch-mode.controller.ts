import chokidar, { FSWatcher } from "chokidar";
import { RequestHandler } from "express";
import path from "path";
import { components } from "../api";
import { logger } from "../logger";
import { ProjectStore } from "../service/project_store";

type StartWatchReq = components["schemas"]["StartWatchRequest"];
type WatchStatusRes = components["schemas"]["WatchStatus"];
type Handler<Req = {}, Res = void> = RequestHandler<{}, Res, Req>;

export class WatchModeController {
   watchingPath: string | null;
   watchingProjectName: string | null;
   watcher: FSWatcher;

   constructor(private projectStore: ProjectStore) {
      this.watchingPath = null;
      this.watchingProjectName = null;
   }

   public getWatchStatus: Handler<{}, WatchStatusRes> = async (_req, res) => {
      return res.json({
         enabled: !!this.watchingPath,
         watchingPath: this.watchingPath,
         projectName: this.watchingProjectName ?? undefined,
      });
   };

   public startWatching: Handler<StartWatchReq> = async (req, res) => {
      const projectManifest = await ProjectStore.reloadProjectManifest(
         this.projectStore.serverRootPath,
      );
      this.watchingProjectName = req.body.projectName;
      this.watchingPath = path.join(
         this.projectStore.serverRootPath,
         projectManifest.projects[req.body.projectName],
      );
      this.watcher = chokidar.watch(this.watchingPath, {
         ignored: (path, stats) =>
            !!stats?.isFile() &&
            !path.endsWith(".malloy") &&
            !path.endsWith(".md"),
         ignoreInitial: true,
      });
      const reloadProject = async () => {
         // Overwrite the project with it's existing metadata to trigger a re-read
         const project = await this.projectStore.getProject(
            req.body.projectName,
            true,
         );
         await this.projectStore.addProject(project.metadata);
         logger.info(`Reloaded ${req.body.projectName}`);
      };

      this.watcher.on("add", async (path) => {
         logger.info(
            `Detected new file ${path}, reloading ${req.body.projectName}`,
         );
         await reloadProject();
      });
      this.watcher.on("unlink", async (path) => {
         logger.info(
            `Detected deletion of ${path}, reloading ${req.body.projectName}`,
         );
         await reloadProject();
      });
      this.watcher.on("change", async (path) => {
         logger.info(
            `Detected change on ${path}, reloading ${req.body.projectName}`,
         );
         await reloadProject();
      });
      res.json();
   };

   public stopWatchMode: Handler = async (_req, res) => {
      this.watcher.close();
      this.watchingPath = null;
      this.watchingProjectName = null;
      res.json();
   };
}
