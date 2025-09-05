# Malloy Publisher SDK

The Malloy Publisher SDK is a comprehensive toolkit designed to facilitate the development and testing of Malloy packages.

## CSS
To pull in CSS styling required by various SDK components do:
```ts
// Import required CSS
import '@malloy-publisher/sdk/styles.css';
```

## Example Usage:
**Rendering a project**
```react
    <Project name="malloy-samples" navigate={navigate} />
``` 
**Rendering a package**
```react
    <Package name="ecommerce" projectName="malloy-samples" navigate={navigate} />
```