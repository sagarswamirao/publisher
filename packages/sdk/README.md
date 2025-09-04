# Malloy Publisher SDK

The Malloy Publisher SDK is a comprehensive toolkit designed to facilitate the development and testing of Malloy packages.

## CSS
To pull in CSS styling required by various SDK components do:
```ts
// Import required CSS
import '@malloy-publisher/sdk/styles.css';
```

## Providers
The SDK components rely on a React Provider to supply context information.
### Example Usage:
**Providing context for a project**
```react
<PublisherResourceProvider
    resourceUri={`publisher://${projectName}`}
>
    <Project navigate={navigate} />
</ProjectProvider>
``` 
**Providing context for a package inside that project**
```react
<PublisherResourceProvider
    resourceUri={`publisher://${projectName}/${packageName}`}
>
    <Package navigate={navigate} />
</PublisherResourceProvider>
```