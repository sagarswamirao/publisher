import { describe, expect, it } from "bun:test";
import { getProjectDescription, generateProjectReadme } from "./parsing";

describe("getProjectDescription", () => {
   it("should return the first paragraph of the README", () => {
      const readme = "# Project Description\nThis is a project description";
      expect(getProjectDescription(readme)).toBe(
         "Project Description\nThis is a project description",
      );
   });

   it("should return a truncated description if it is longer than 120 characters", () => {
      const longDescription = Array(40).fill("abcde").join(" ");
      const readme = `${longDescription}`;
      // 5 characters per word + space, so 20 words = 120 characters
      const truncatedDescription = Array(20).fill("abcde").join(" ") + "...";
      expect(getProjectDescription(readme)).toBe(truncatedDescription);
   });

   it("should return a placeholder description if the README is empty", () => {
      const readme = "";
      expect(getProjectDescription(readme)).toBe(
         "Explore semantic models, run queries, and build dashboards",
      );
   });
});

describe("generateProjectReadme", () => {
   it("should preserve the existing readme if it exists", () => {
      const project = {
         name: "Test Project",
         readme: "# Test Readme",
      };
      expect(generateProjectReadme(project)).toBe("# Test Readme");
   });

   it("should generate a project readme with the description if it does not exist", () => {
      const project = {
         name: "Test Project",
         readme: "",
      };
      expect(generateProjectReadme(project, "Test Description")).toBe(
         "# Test Project\n\nTest Description",
      );
   });

   it("should insert the description in the existing readme if both exist", () => {
      const project = {
         name: "Test Project",
         readme: "# Test Readme\n\nOld Description\n\nMore stuff",
      };
      expect(generateProjectReadme(project, "New Description")).toBe(
         "# Test Readme\n\nNew Description\n\nMore stuff",
      );
   });
});
