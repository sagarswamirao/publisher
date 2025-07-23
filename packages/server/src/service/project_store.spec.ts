import { describe, expect, it, mock, spyOn } from "bun:test";
import * as fs from "fs/promises";
import path from "path";
import { FrozenConfigError, ProjectNotFoundError } from "../errors";
import { isPublisherConfigFrozen } from "../utils";
import { ProjectStore } from "./project_store";

describe("ProjectStore", () => {
   const serverRoot = path.resolve(
      process.cwd(),
      process.env.SERVER_ROOT || ".",
   );

   async function waitForInitialization(projectStore: ProjectStore) {
      const maxRetries = 100;
      let retries = 0;
      do {
         await new Promise((resolve) => setTimeout(resolve, 10));
         retries++;
      } while (
         (await projectStore.listProjects()).length === 0 &&
         retries < maxRetries
      );
      if ((await projectStore.listProjects()).length === 0) {
         throw new Error("Timed out initializing ProjectStore");
      }
   }

   it("should load all projects from publisher.config.json within a second on initialization", async () => {
      mock(isPublisherConfigFrozen).mockReturnValue(true);
      const projectStore = new ProjectStore(serverRoot);
      await waitForInitialization(projectStore);
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.stringContaining("# Malloy Analysis Examples"),
            resource: "/api/v0/projects/malloy-samples",
         },
      ]);
   });

   it("should list projects from memory by default", async () => {
      mock(isPublisherConfigFrozen).mockReturnValue(true);
      const projectStore = new ProjectStore(serverRoot);
      await waitForInitialization(projectStore);

      // Mock fs.readFile & fs.readdir to track calls
      const readFileSpy = spyOn(fs, "readFile");
      const readdirSpy = spyOn(fs, "readdir");
      // Call listProjects, which should use memory and not call fs.readFile
      await projectStore.listProjects();

      expect(readFileSpy).not.toHaveBeenCalled();
      expect(readdirSpy).not.toHaveBeenCalled();
   });

   it("should list projects from disk if reload is true", async () => {
      // Mock fs.readFile to track calls
      const fs = await import("fs/promises");
      const readFileSpy = spyOn(fs, "readFile");
      mock(isPublisherConfigFrozen).mockReturnValue(true);
      const projectStore = new ProjectStore(serverRoot);

      // Call getProject with reload=true
      await projectStore.getProject("malloy-samples", true);

      expect(readFileSpy).toHaveBeenCalled();
   });

   it("should allow modifying the in-memory hashmap if config is not frozen", async () => {
      mock.module("../utils", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      await waitForInitialization(projectStore);
      await projectStore.updateProject({
         name: "malloy-samples",
         readme: "Updated README",
      });
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: "Updated README",
            resource: "/api/v0/projects/malloy-samples",
         },
      ]);
      await projectStore.deleteProject("malloy-samples");
      expect(await projectStore.listProjects()).toEqual([]);
      await projectStore.addProject({
         name: "malloy-samples",
      });

      expect(
         await projectStore.getProject("malloy-samples", false),
      ).toHaveProperty("metadata", {
         name: "malloy-samples",
         resource: "/api/v0/projects/malloy-samples",
      });

      // After a while, it'll resolve the async promise where the readme gets loaded in memory
      await waitForInitialization(projectStore);
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.stringContaining("# Malloy Analysis Examples"),
            resource: "/api/v0/projects/malloy-samples",
         },
      ]);
   });

   it("should not allow modifying the in-memory hashmap if config is frozen", async () => {
      mock.module("../utils", () => ({
         isPublisherConfigFrozen: () => true,
      }));
      const projectStore = new ProjectStore(serverRoot);
      // Initialization should succeed
      await waitForInitialization(projectStore);
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.stringContaining("# Malloy Analysis Examples"),
            resource: "/api/v0/projects/malloy-samples",
         },
      ]);
      // Adding a project should fail
      expect(
         projectStore.addProject({
            name: "malloy-samples",
         }),
      ).rejects.toThrow(FrozenConfigError);

      // Updating a project should fail
      expect(
         projectStore.updateProject({
            name: "malloy-samples",
            readme: "Updated README",
         }),
      ).rejects.toThrow(FrozenConfigError);

      // Deleting a project should fail
      expect(projectStore.deleteProject("malloy-samples")).rejects.toThrow(
         FrozenConfigError,
      );

      // Failed methods should not modify the in-memory hashmap
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.stringContaining("# Malloy Analysis Examples"),
            resource: "/api/v0/projects/malloy-samples",
         },
      ]);
   });

   it("should always try to reload a project if it's not in the hashmap", async () => {
      mock.module("../utils", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      await waitForInitialization(projectStore);
      await projectStore.deleteProject("malloy-samples");
      expect(await projectStore.listProjects()).toEqual([]);
      const readFileSpy = spyOn(fs, "readFile");
      await projectStore.getProject("malloy-samples", true);
      expect(readFileSpy).toHaveBeenCalled();
   });

   it("should throw a NotFound error when reloading a project that is not in disk", async () => {
      mock.module("../utils", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      await waitForInitialization(projectStore);
      expect(
         projectStore.getProject("this-one-does-not-exist", true),
      ).rejects.toThrow(ProjectNotFoundError);
   });
});
