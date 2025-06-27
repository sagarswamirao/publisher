# Embedded Data Apps (React SDK)

The Publisher makes it easy to embed governed analytics into your web applications—directly from your semantic models and notebooks. The SDK lets you drop live visualizations, metrics, or full analyses into your product with just a few lines of code.

## Try the Sample App

1. Make sure the Publisher server is running locally on port `4000` (follow instructions in the [Main README](../../README.md)).
2. Open the `examples/data-app` directory in the Publisher repo.
3. Copy `.env.example` to `.env`. You should not need to change the `VITE_PUBLISHER_API` variable there unless your Publisher server is running elsewhere. NOTE: even though the Publisher is running on port `4000`, the API request is proxied through port `5173` (this web app) to avoid CORS issues.
4. Run the following commands to start the app:

   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the "Malloy Samples" dashboard show with some charts and tables from the "names" package in the "malloy-samples" project.

Click on "Dynamic Dashboard" to build your own dashboard by adding embed tags for notebook analyses or click on "Single Embed" to see an example where you can embed a single analysis directly in the code.

When adding a panel to the "Dynamic Dashboard", your embed snippet should look like this:

```tsx
<QueryResult
  projectName="malloy-samples"
  packageName="names"
  modelPath="names1.malloynb"
  query="run: names -> { aggregate: total_population }"
/>
```

## Embed a Published Analysis

You can embed any analysis cell from your published Malloy notebook directly into the app.

1. In any ".malloynb" notebook file on the Publisher platform, find an analysis block you want to embed.
2. Take note of the `projectName`, `packageName`, and `modelPath` (path to the notebook file).
3. Click "<>" to view the analysis code (`query`) and copy it.
4. Open `SingleEmbedDashboard.tsx` inside the `examples/data-app/src/components` folder.
5. Replace the `<Box />` placeholder with the values indicated below.

   The code will look something like this:
   ```tsx
   import { ServerProvider, PackageProvider, QueryResult } from "@malloy-publisher/sdk";

   export default function SingleEmbedDashboard() {
     return (
       <div className="dashboard">
         <ServerProvider server="https://localhost:4000/api/v0">
            <PackageProvider projectName="malloy-samples" packageName="names">
               <QueryResult 
                  modelPath="names1.malloynb"
                  query="run: names -> { aggregate: total_population }" />
            </PackageProvider>
         </ServerProvider>
       </div>
     );
   }
   ```

6. Save the file and refresh your browser.  
   You should now see live, governed analytics served directly from your semantic model.

> ✅ Great for building internal tools, customer-facing dashboards, or any UI that needs trustworthy data experiences.

> 🔁 You can reuse this pattern to embed multiple notebook blocks, semantic model views, or even full interactive dashboards—all powered by a single semantic definition.
