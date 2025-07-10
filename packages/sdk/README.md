# Malloy Publisher SDK

The Malloy Publisher SDK is a comprehensive toolkit designed to facilitate the development and testing of Malloy packages.

## CSS
To pull in CSS styling required by various SDK components do:
```ts
// Import required CSS
import '@malloy-publisher/sdk/styles.css';
```

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
**PackageProvider**
```react
<PackageProvider
    server={server}
    projectName={projectName}
    packageName={packageName}
    >
    <Package navigate={navigate} />
</PackageProvider>
```