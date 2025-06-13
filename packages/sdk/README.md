# Malloy Publisher SDK

The Malloy Publisher SDK is a comprehensive toolkit designed to facilitate the development and testing of Malloy packages.

## Providers
The SDK components rely on React Providers to supply context information.
There are current 2 Providers, 1 for Packages, 1 for Project components.
### Example Usage:
**ProjectProvider**
```react
 <ProjectProvider server={server} projectName={projectName}>
    <Project navigate={navigate} />
</ProjectProvider>
``` 
**PublisherPackageProvider**
```react
<PublisherPackageProvider
    server={server}
    projectName={projectName}
    packageName={packageName}
    >
    <Package navigate={navigate} />
</PublisherPackageProvider>
```