# Embedded Data Apps (React SDK)

The Publisher makes it easy to embed governed analytics into your web applications—directly from your semantic models and notebooks. The SDK lets you drop live visualizations, metrics, or full analyses into your product with just a few lines of code.

### Try the Sample App

1. Open the `examples/data-app` in the publisher repo.
2. Copy `.env.example` to `.env` and fill in the values so that the Malloy Samples dashboard will render correctly. You will set the `DEFAULT_ORGANIZATION` to the organization that was given to you for the demo.
3. Run the following commands to start the app:

   ```bash
   cd sample_data_app
   npm install
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the "Malloy Samples" dashboard show with some charts and tables from the "names" package in the "malloy-samples" project.

Click on "Dynamic Dashboard" to build your own dashboard by adding embed tags for notebook analyses or click on "Single Embed" to see an example where you can embed a single analysis directly in the code.

### Embed a Published Analysis

You can embed any analysis cell from your published Malloy notebook directly into the app.

1. In your notebook in the Publisher platform, find the analysis block you want to embed.
2. Click the **“Embed”** button for that block.
3. Copy the embed code provided in the dialog.

### Add the Embed to Your App

1. Open `SingleEmbedDashboard.tsx` inside the `sample_data_app/src/components` folder.
2. Replace the `<Box />` placeholder with your copied embed code.

   The code will look something like this:

   ```tsx
   import { QueryResult } from "@malloy-publisher/sdk";

   export default function SingleEmbedDashboard() {
     return (
       <div className="dashboard">
         <QueryResult
           server="https://localhost:4000/api/v0"
           projectName="malloy-samples"
           packageName="names"
           modelPath="names1.malloynb"
           query="
              run: names-> {
                aggregate: total_population
              }
            "
         />
       </div>
     );
   }
   ```

3. Save the file and refresh your browser.  
   You should now see live, governed analytics served directly from your semantic model.

> ✅ Great for building internal tools, customer-facing dashboards, or any UI that needs trustworthy data experiences.

> 🔁 You can reuse this pattern to embed multiple notebook blocks, semantic model views, or even full interactive dashboards—all powered by a single semantic definition.
