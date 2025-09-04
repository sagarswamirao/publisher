import { describe, expect, it } from "bun:test";
import { encodeResourceUri, parseResourceUri } from "./formatting";

describe("parseResourceUri", () => {
   it("should parse a resource URI", () => {
      const resourceUri = "publisher://project/package/version";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         project: "project",
         package: "package",
         version: "version",
      });
   });

   it("should throw an error if the resource URI is invalid", () => {
      const resourceUri = "invalid://format";
      expect(() => parseResourceUri(resourceUri)).toThrow(
         "Failed to parse resource URI: invalid://format",
      );
   });

   it("should throw an error if the resource URI is missing the project name", () => {
      const resourceUri = "publisher://";
      expect(() => parseResourceUri(resourceUri)).toThrow(
         /Failed to parse resource URI/,
      );
   });

   it("should not throw an error if the resource URI is missing the package name", () => {
      const resourceUri = "publisher://project/";
      expect(() => parseResourceUri(resourceUri)).not.toThrow();
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         project: "project",
         package: undefined,
         version: undefined,
      });
   });

   it("should not throw an error if the resource URI is missing the version", () => {
      const resourceUri = "publisher://project/package";
      expect(() => parseResourceUri(resourceUri)).not.toThrow();
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({
         project: "project",
         package: "package",
         version: undefined,
      });
   });
});

describe("encodeResourceUri", () => {
   it("should encode a resource URI", () => {
      const resource = {
         project: "project",
         package: "package",
         version: "version",
      };
      const encodedResource = encodeResourceUri(resource);
      expect(encodedResource).toEqual("publisher://project/package/version");
   });

   it("should throw an error if the resource is missing the project name", () => {
      const resource = { project: "", package: "package", version: "version" };
      expect(() => encodeResourceUri(resource)).toThrow(
         /Failed to encode resource URI/,
      );
   });

   it("should not add the version if the package is not provided", () => {
      const resource = { project: "project", version: "version" };
      const encodedResource = encodeResourceUri(resource);
      expect(encodedResource).toEqual("publisher://project");
   });
});
