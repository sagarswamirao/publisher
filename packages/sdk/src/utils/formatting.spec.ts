import { describe, expect, it } from "bun:test";
import { parseResourceUri } from "./formatting";

describe("formatting", () => {
   it("should parse a resource URI", () => {
      const resourceUri = "publisher://project/package/version";
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({ project: "project", package: "package", version: "version" });
   });

   it("should throw an error if the resource URI is invalid", () => {
      const resourceUri = "invalid://format";
      expect(() => parseResourceUri(resourceUri)).toThrow("Failed to parse resource URI: invalid://format");
   });

   it("should throw an error if the resource URI is missing the project name", () => {
      const resourceUri = "publisher://";
      expect(() => parseResourceUri(resourceUri)).toThrow(/Failed to parse resource URI/);
   });

   it("should not throw an error if the resource URI is missing the package name", () => {
      const resourceUri = "publisher://project/";
      expect(() => parseResourceUri(resourceUri)).not.toThrow();
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({ project: "project", package: undefined, version: undefined });
   });

   it("should not throw an error if the resource URI is missing the version", () => {
      const resourceUri = "publisher://project/package";
      expect(() => parseResourceUri(resourceUri)).not.toThrow();
      const parsedResource = parseResourceUri(resourceUri);
      expect(parsedResource).toEqual({ project: "project", package: "package", version: undefined });
   });
});