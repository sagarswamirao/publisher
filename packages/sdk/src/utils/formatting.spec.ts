import { describe, expect, it } from "bun:test";
import { encodeResourceUri, parseResourceUri } from "./formatting";

describe("parseResourceUri", () => {
   it("should parse a package URI", () => {
      const resourceUri = "publisher://projects/malloy-samples/packages/names";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         projectName: "malloy-samples",
         packageName: "names",
         connectionName: undefined,
         modelPath: undefined,
         versionId: undefined,
      });
   });
   it("should parse a connection URI", () => {
      const resourceUri =
         "publisher://projects/malloy-samples/connections/bigquery";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         projectName: "malloy-samples",
         packageName: undefined,
         connectionName: "bigquery",
         modelPath: undefined,
         versionId: undefined,
      });
   });

   it("should parse a modelPath URI", () => {
      const resourceUri =
         "publisher://projects/malloy-samples/packages/names/models/names1.malloynb";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         projectName: "malloy-samples",
         packageName: "names",
         connectionName: undefined,
         modelPath: "names1.malloynb",
         versionId: undefined,
      });
   });

   it("should throw an error if the resource URI has the wrong protocol", () => {
      const resourceUri =
         "http://projects/malloy-samples/packages/names/models/names1.malloynb";
      expect(() => parseResourceUri(resourceUri)).toThrow(
         `Failed to parse resource URI: ${resourceUri}`,
      );
   });

   it("should throw an error if the resource URI is missing the project name", () => {
      const resourceUri = "publisher://";
      expect(() => parseResourceUri(resourceUri)).toThrow(
         /Failed to parse resource URI/,
      );
   });

   it("should parse the optional versionId parameter if present", () => {
      const resourceUri =
         "publisher://projects/malloy-samples/packages/names?versionId=1.0.0";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         projectName: "malloy-samples",
         packageName: "names",
         connectionName: undefined,
         modelPath: undefined,
         versionId: "1.0.0",
      });
   });
});

describe("encodeResourceUri", () => {
   it("should encode a package URI with no versionId", () => {
      const resourceUri = encodeResourceUri({
         projectName: "malloy-samples",
         packageName: "names",
         connectionName: undefined,
         modelPath: undefined,
         versionId: undefined,
      });
      expect(resourceUri).toEqual(
         "publisher://projects/malloy-samples/packages/names",
      );
   });

   it("should encode a package URI with a versionId", () => {
      const resourceUri = encodeResourceUri({
         projectName: "malloy-samples",
         packageName: "names",
         versionId: "1.0.0",
         connectionName: undefined,
         modelPath: undefined,
      });
      expect(resourceUri).toEqual(
         "publisher://projects/malloy-samples/packages/names?versionId=1.0.0",
      );
   });

   it("should encode a connection URI", () => {
      const resourceUri = encodeResourceUri({
         projectName: "malloy-samples",
         packageName: undefined,
         connectionName: "bigquery",
         modelPath: undefined,
         versionId: undefined,
      });
      expect(resourceUri).toEqual(
         "publisher://projects/malloy-samples/connections/bigquery",
      );
   });

   it("should encode a modelPath URI", () => {
      const resourceUri = encodeResourceUri({
         projectName: "malloy-samples",
         packageName: "names",
         connectionName: undefined,
         modelPath: "names1.malloynb",
         versionId: undefined,
      });
      expect(resourceUri).toEqual(
         "publisher://projects/malloy-samples/packages/names/models/names1.malloynb",
      );
   });

   it("should throw an error if the resource URI is missing the project name", () => {
      expect(() =>
         encodeResourceUri({
            projectName: "",
            packageName: "names",
            connectionName: undefined,
            modelPath: undefined,
            versionId: undefined,
         }),
      ).toThrow(/Failed to encode resource URI, missing project name/);
   });
});
