export type ParsedResource = {
   project: string;
   package?: string | undefined;
   version?: string | undefined;
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
      throw new Error(
         `Failed to parse resource URI, missing project name: ${resourceUri}`,
      );
   }
   return {
      project: parsedResource.project,
      package: parsedResource.package || undefined,
      version: parsedResource.version || undefined,
   };
};

export const encodeResourceUri = (resource: ParsedResource) => {
   if (!resource.project) {
      throw new Error(
         `Failed to encode resource URI, missing project name: ${resource}`,
      );
   }
   let uri = `publisher://${resource.project}`;
   if (resource.package) {
      uri += `/${resource.package}`;
   }
   if (resource.package && resource.version) {
      uri += `/${resource.version}`;
   }
   return uri;
};