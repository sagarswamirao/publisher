export type ParsedResource = {
   project: string;
   package: string | undefined;
   version: string | undefined;
};

export const parseResourceUri = (resourceUri: string) => {
   const resourceRegex =
      /^publisher:\/\/(?<project>[^/]+)\/?(?<package>[^/]*)\/?(?<version>[^/]*)$/;
   const match = resourceUri.match(resourceRegex);
   if (!match) {
      throw new Error(`Failed to parse resource URI: ${resourceUri}`);
   }
   const parsedResource = match.groups as ParsedResource;
   if (!parsedResource.project) {
      throw new Error(`Failed to parse resource URI, missing project name: ${resourceUri}`);
   }
   return {
      project: parsedResource.project,
      package: parsedResource.package || undefined,
      version: parsedResource.version || undefined,
   };
};
