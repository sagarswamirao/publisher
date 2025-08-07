import { beforeAll, describe, expect, it, mock, spyOn } from "bun:test";
import { rmSync } from "fs";
import * as fs from "fs/promises";
import path from "path";
import { isPublisherConfigFrozen } from "../config";
import { publisherPath } from "../constants";
import { FrozenConfigError, ProjectNotFoundError } from "../errors";
import { logger } from "../logger";
import { ProjectStore } from "./project_store";

describe("ProjectStore", () => {
   const serverRoot = path.resolve(
      process.cwd(),
      process.env.SERVER_ROOT || ".",
   );

   beforeAll(() => {
      rmSync(path.resolve(publisherPath, "malloy-samples"), {
         recursive: true,
         force: true,
      });
      mock.module("../logger", () => ({
         logger: {
            ...logger,
            info: (..._args: any[]) => {},
         },
      }));
   });

   it("should load all projects from publisher.config.json on initialization", async () => {
      mock(isPublisherConfigFrozen).mockReturnValue(true);
      const projectStore = new ProjectStore(serverRoot);
      mock(projectStore.downloadGitHubDirectory).mockResolvedValue(undefined);
      await projectStore.finishedInitialization;
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.any(String),
            resource: "/api/v0/projects/malloy-samples",
            packages: expect.any(Array),
            connections: expect.any(Array),
         },
      ]);
   });

   it("should list projects from memory by default", async () => {
      mock(isPublisherConfigFrozen).mockReturnValue(true);
      const projectStore = new ProjectStore(serverRoot);
      const projects = await projectStore.listProjects();
      expect(projects).toEqual([
         {
            name: "malloy-samples",
            readme: expect.any(String),
            resource: "/api/v0/projects/malloy-samples",
            packages: expect.any(Array),
            connections: expect.any(Array),
         },
      ]);
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
      mock.module("../config", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      mock(projectStore.downloadGitHubDirectory).mockResolvedValue(undefined);
      await projectStore.finishedInitialization;
      await projectStore.updateProject({
         name: "malloy-samples",
         readme: "Updated README",
      });
      let projects = await projectStore.listProjects();
      projects = await projectStore.listProjects();
      let malloySamplesProject = projects.find(
         (p) => p.name === "malloy-samples",
      );
      expect(malloySamplesProject).toBeDefined();
      expect(malloySamplesProject).toMatchObject(
         expect.objectContaining({
            name: "malloy-samples",
            readme: "Updated README",
            resource: "/api/v0/projects/malloy-samples",
         }),
      );
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
         location: expect.any(String),
      });

      projects = await projectStore.listProjects();
      malloySamplesProject = projects.find((p) => p.name === "malloy-samples");
      expect(malloySamplesProject).toBeDefined();
      expect(malloySamplesProject).toMatchObject({
         name: "malloy-samples",
         resource: "/api/v0/projects/malloy-samples",
      });
   });

   it("should not allow modifying the in-memory hashmap if config is frozen", async () => {
      mock.module("../config", () => ({
         isPublisherConfigFrozen: () => true,
      }));
      const projectStore = new ProjectStore(serverRoot);
      // Initialization should succeed
      await projectStore.finishedInitialization;
      expect(await projectStore.listProjects()).toEqual([
         {
            name: "malloy-samples",
            readme: expect.any(String),
            resource: "/api/v0/projects/malloy-samples",
            packages: expect.any(Array),
            connections: expect.any(Array),
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
            readme: expect.any(String),
            resource: "/api/v0/projects/malloy-samples",
            packages: expect.any(Array),
            connections: expect.any(Array),
         },
      ]);
   });

   it("should always try to reload a project if it's not in the hashmap", async () => {
      mock.module("../config", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      await projectStore.finishedInitialization;
      await projectStore.deleteProject("malloy-samples");
      expect(await projectStore.listProjects()).toEqual([]);
      const readFileSpy = spyOn(fs, "readFile");
      await projectStore.getProject("malloy-samples", true);
      expect(readFileSpy).toHaveBeenCalled();
   });

   it("should throw a NotFound error when reloading a project that is not in disk", async () => {
      mock.module("../config", () => ({
         isPublisherConfigFrozen: () => false,
      }));
      const projectStore = new ProjectStore(serverRoot);
      await projectStore.finishedInitialization;
      expect(
         projectStore.getProject("this-one-does-not-exist", true),
      ).rejects.toThrow(ProjectNotFoundError);
   });
});
