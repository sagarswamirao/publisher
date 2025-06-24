# Malloy Publisher App

A React application for exploring and visualizing Malloy data models. This package can be used in two ways:

1. **As a React component library** - Import and embed the app in your own React applications
2. **As a standalone executable** - Run the complete Malloy Publisher server and app with a single command

## Library Usage

Use the Malloy Publisher app as a React component in your own applications:

```tsx
import { MalloyPublisherApp } from '@malloy-publisher/app';
import '@malloy-publisher/app/app.css';

function MyApp() {
  return (
    <MalloyPublisherApp 
      server="http://localhost:4000/api/v0"
      basePath="/malloy"
      showHeader={true}
    />
  );
}
```

### Props

- `server` - The URL of the Malloy Publisher server API
- `accessToken` - Optional access token for authentication
- `basePath` - Base path for routing (default: "/")
- `showHeader` - Whether to show the app header (default: true)

## Standalone Executable Usage

Run the complete Malloy Publisher (server + app) as a standalone application:

```bash
# Run directly via npx (no installation needed)
npx @malloy-publisher/app --server-root /path/to/malloy/projects

# Or with bunx
bunx @malloy-publisher/app --server-root /path/to/malloy/projects

# Install globally
npm install -g @malloy-publisher/app

# Run with default settings (localhost:4000)
malloy-publisher-app

# Run with custom settings
malloy-publisher-app --port 3000 --host 0.0.0.0 --server-root /path/to/malloy/projects
```

### CLI Options

- `-p, --port <number>` - Port to run the server on (default: 4000)
- `-h, --host <string>` - Host to bind the server to (default: localhost)
- `-r, --server-root <path>` - Root directory for Malloy projects (default: current directory)
- `--help` - Show help message

### Examples

```bash
# Start on port 3000
malloy-publisher-app --port 3000

# Bind to all interfaces on port 8080
malloy-publisher-app --host 0.0.0.0 --port 8080

# Use a specific project directory
malloy-publisher-app --server-root /path/to/malloy/projects
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library version (React components for other packages)
npm run build:lib

# Build standalone web app (static files)
npm run build:app

# Build CLI executable
npm run build:cli

# Build everything (library + app + CLI)
npm run build:all

# Development builds (with source maps, unminified)
npm run build:lib:dev
npm run build:app:dev
```

### Build Types Explained

- **`build:lib`** - Creates a React component library that other packages can import
- **`build:app`** - Creates a standalone web application (static HTML/JS/CSS files)  
- **`build:cli`** - Creates the executable CLI script for npx/bunx usage
- **`build:all`** - Builds all three outputs

## Integration Example

For an example of how to integrate this in your own application, see the `example-integration.md` file.

## Dependencies

The standalone executable requires `@malloy-publisher/server` to be available. When used as a library, you need to provide your own server instance.

# Publisher Server Development

In development, there are 2 servers- the Node.JS API server and the React Dev server.
In production, there's just 1 server- the Node server, and it serves the UI statically.
The development server will hot-load changes. Changes to the Node.JS will cause the server to restart, changes to the React UI should be hot-loaded. Though note that BOTH systems sometimes fail to detect/implement changes, so don't be shy about restarting them.

First, generate the OpenAPI implementation files. From the root publisher directory run:

```
bun generate-api-types
```

This is done also done as part of the production server & sdk builds.

To run in development, you'll want 2 terms (you can obv run them in the BG, but in dev mode they
can get gorked and you'll want to be able to kill/restart them):

```
bun run start:dev
```

```
bun run start:dev:react
```

### Linking Renderer code

The SDK depends on `@malloydata-render`. Often changes involve edits to both the Malloy render code and the app/SDK. It's useful to have the server run and depend on a local copy of the `render` code rather than the NPM package. TO set this up:

```
[clone the @malloydata/malloy repo]
cd MALLOY_ROOT/packages/malloy-render
bun link

cd PUBLISHER_ROOT/packages/sdk
bun link @malloydata/render
```

The publisher react server will now depend on your local copy of Malloy render. However, to push the changes, you must **build** the Malloy renderer:

```
cd MALLOY_ROOT/packages/malloy-render
npm run build
```

[Note: you'll need to build from the `malloy` root once to create all the deps the renderer needs]
