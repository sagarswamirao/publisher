import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "fs/promises";
import { join } from "path";
import sinon from "sinon";
import { PackageNotFoundError } from "../errors";
import { readConnectionConfig } from "./connection";
import { Model } from "./model";
import { Package } from "./package";
import { Scheduler } from "./scheduler";

// Minimal partial types for mocking
type PartialScheduler = Pick<Scheduler, "list">;

describe("service/package", () => {
   const testPackageDirectory = "testPackage";

   beforeEach(async () => {
      await fs.mkdir(testPackageDirectory, { recursive: true });
      await fs.writeFile(join(testPackageDirectory, "model1.model"), "");
      // Create a simple parquet file with schema "name: string, value: int"
      const parquetBuffer = Buffer.from("Name,Value\nJohn,10\nJane,20\nJim,30");

      await fs.writeFile(
         join(testPackageDirectory, "database.csv"),
         parquetBuffer,
      );
      const content = JSON.stringify([
         { name: "conn1", type: "database" },
         { name: "conn2", type: "api" },
      ]);
      await fs.writeFile(
         join(testPackageDirectory, "publisher.connections.json"),
         content,
      );
      const publisherContent = JSON.stringify({ description: "Test package" });
      await fs.writeFile(
         join(testPackageDirectory, "publisher.json"),
         publisherContent,
      );
   });

   afterEach(async () => {
      sinon.restore();
      await fs.rm(testPackageDirectory, { recursive: true });
   });

   it("should create a package instance", async () => {
      // Using 'as any' for simplified mock Map value in test
      const pkg = new Package(
         "testProject",
         "testPackage",
         testPackageDirectory,
         { name: "testPackage", description: "Test package" },
         [],
         new Map([
            ["model1.malloy", { getPath: () => "model1.malloy" } as any],
            ["model2.malloynb", { getPath: () => "model2.malloynb" } as any],
         ]),
         undefined,
      );

      expect(pkg).toBeInstanceOf(Package);
   });

   describe("instance methods", () => {
      describe("create", () => {
         it("should throw PackageNotFoundError if the package manifest does not exist", async () => {
            await fs.rm(join(testPackageDirectory, "publisher.json"));
            sinon.stub(fs, "stat").rejects(new Error("File not found"));

            await expect(
               Package.create(
                  "testProject",
                  "testPackage",
                  testPackageDirectory,
                  new Map(),
               ),
            ).rejects.toThrowError(
               PackageNotFoundError,
               "Package manifest for testPackage does not exist.",
            );
         });
         it("should return a Package object if the package exists", async () => {
            sinon.stub(fs, "stat").resolves();
            sinon
               .stub(fs, "readFile")
               .resolves(
                  Buffer.from(JSON.stringify({ description: "Test package" })),
               );

            // Still use Partial<Model> for the stub resolution type
            type PartialModel = Pick<Model, "getPath">;
            sinon
               .stub(Model, "create")
               .resolves({ getPath: () => "model1.model" } as PartialModel);

            sinon.stub(Scheduler, "create").returns({
               list: () => [],
            } as PartialScheduler);

            const packageInstance = await Package.create(
               "testProject",
               "testPackage",
               testPackageDirectory,
               new Map(),
            );

            expect(packageInstance).toBeInstanceOf(Package);
            expect(packageInstance.getPackageName()).toBe("testPackage");
            expect(packageInstance.getPackageMetadata().description).toBe(
               "Test package",
            );
            expect(packageInstance.listDatabases()).toEqual([
               {
                  path: "database.csv",
                  type: "embedded",
                  info: {
                     name: "database.csv",
                     columns: [
                        { name: "Name", type: "string" },
                        { name: "Value", type: "number" },
                     ],
                     rowCount: 3,
                  },
               },
            ]);
            expect(packageInstance.listModels()).toBeEmpty();
            expect(packageInstance.listSchedules()).toBeEmpty();
         });
      });

      describe("listModels", () => {
         it("should return a list of models with their paths and types", async () => {
            // Using 'as any' for simplified mock Map value in test
            const packageInstance = new Package(
               "testProject",
               "testPackage",
               testPackageDirectory,
               { name: "testPackage", description: "Test package" },
               [],
               new Map([
                  [
                     "model1.malloy",
                     {
                        getPath: () => "model1.malloy",
                        getModel: () => "foo",
                     } as any,
                  ],
                  [
                     "model2.malloynb",
                     {
                        getPath: () => "model2.malloynb",
                        getNotebookError: () => {
                           return {
                              message: "This is the error",
                           };
                        },
                     } as any,
                  ],
               ]),
               undefined,
            );

            const models = await packageInstance.listModels();
            expect(models).toEqual([
               {
                  projectName: "testProject",
                  packageName: "testPackage",
                  path: "model1.malloy",
                  error: undefined,
               },
            ]);

            const notebooks = await packageInstance.listNotebooks();
            expect(notebooks).toEqual([
               {
                  projectName: "testProject",
                  packageName: "testPackage",
                  path: "model2.malloynb",
                  error: "This is the error",
               },
            ]);
         });
      });

      describe("getDatabaseInfo", () => {
         it("should return the size of the database file", async () => {
            sinon.stub(fs, "stat").resolves({ size: 13 } as { size: number });

            // @ts-expect-error Accessing private static method for testing
            const info = await Package.getDatabaseInfo(
               testPackageDirectory,
               "database.csv",
            );

            expect(info).toEqual({
               name: "database.csv",
               columns: [
                  { name: "Name", type: "string" },
                  { name: "Value", type: "number" },
               ],
               rowCount: 3,
            });
         });
      });

      describe("readConnectionConfig", () => {
         it("should return an empty array if the connection manifest does not exist", async () => {
            await fs.rm(
               join(testPackageDirectory, "publisher.connections.json"),
            );

            sinon.stub(fs, "stat").rejects(new Error("File not found"));

            const config = await readConnectionConfig(testPackageDirectory);
            expect(Array.isArray(config)).toBe(true);
            expect(config).toHaveLength(0);
         });

         it("should return the parsed connection config if it exists", async () => {
            sinon.stub(fs, "stat").resolves();
            const config = await readConnectionConfig(testPackageDirectory);

            expect(config).toEqual([
               { name: "conn1", type: "database" },
               { name: "conn2", type: "api" },
            ]);
         });
      });
   });
});
