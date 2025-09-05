export type ParsedResource = {
   projectName: string;
   packageName?: string | undefined;
   connectionName?: string | undefined;
   versionId?: string | undefined;
   modelPath?: string | undefined;
};

export const parseResourceUri = (resourceUri: string) => {
   const parsedUri = new URL(resourceUri);
   let parsedResource = {} as ParsedResource;
   if (parsedUri.protocol !== "publisher:") {
      throw new Error(`Failed to parse resource URI: ${resourceUri}`);
   }
   const pathParts = (parsedUri.hostname + parsedUri.pathname).split("/");
   for (let i = 0; i < pathParts.length; i += 2) {
      const part = pathParts[i];
      if (part === "project") {
         parsedResource.projectName = pathParts[i + 1] || undefined;
      } else if (part === "package") {
         parsedResource.packageName = pathParts[i + 1] || undefined;
      } else if (part === "connection") {
         parsedResource.connectionName = pathParts[i + 1] || undefined;
      } else if (part === "model") {
         parsedResource.modelPath = pathParts[i + 1] || undefined;
      }
   }

   parsedResource.versionId =
      parsedUri.searchParams.get("versionId") || undefined;
   if (!parsedResource.projectName) {
      throw new Error(`Failed to parse resource URI: ${resourceUri}`);
   }
   return parsedResource;
};

export const encodeResourceUri = (resource: ParsedResource) => {
   if (!resource.projectName) {
      throw new Error(
         `Failed to encode resource URI, missing project name: ${resource}`,
      );
   }
   let uri = `publisher://project/${resource.projectName}`;
   if (resource.packageName) {
      uri += `/package/${resource.packageName}`;
   }
   if (resource.connectionName) {
      uri += `/connection/${resource.connectionName}`;
   }
   if (resource.modelPath) {
      uri += `/model/${resource.modelPath}`;
   }
   if (resource.packageName && resource.versionId) {
      uri += `?versionId=${resource.versionId}`;
   }
   return uri;
};
