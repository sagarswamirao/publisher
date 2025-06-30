# FILE 1: Getting Started with Notebook-Based Dashboards in Malloy

## 1. Introduction

Effective presentation of data is critical for deep insight and informed decisions. The most powerful and trustworthy dashboards are those built with code on a governed semantic model. Malloy empowers you to create these code-driven experiences through notebook-based dashboards.

This guide will walk you through building, refining, and publishing a live, interactive data story using Malloy notebooks. We'll cover how these notebooks are structured, how to develop them locally with a fast feedback loop, and how to share them with others using Malloy Publisher.

### Key Benefits

-   **Code-Based & Version Controllable:** Because your entire dashboard is code, it can be version-controlled in Git, hosted anywhere, and easily shared, making it a truly durable and trustworthy data asset.
-   **Governed Semantic Model:** Notebooks are built on top of a Malloy model, ensuring that all queries are consistent, accurate, and use predefined business logic.
-   **Guaranteed Correct Metrics:** Malloy is built to understand the relationships in your data model. This allows it to perform **symmetric aggregates**, ensuring that metrics like counts, sums, and averages are calculated correctly even across joins with different levels of granularity, preventing common data inflation errors.
-   **Live & Interactive:** Published notebooks are not static reports. They are live data experiences where each query is executed in real-time, allowing for exploration.
-   **Narrative-Driven:** Weave together queries with standard Markdown to create a cohesive data story with titles, explanations, and commentary.
-   **Rapid Development:** A tight feedback loop with a live, local preview in the Malloy VS Code extension allows you to see your changes instantly.

---

## 2. Getting Started: Zero-Install with Your Browser

The fastest way to get started with Malloy is directly in your web browser, with no local installation required. This approach uses GitHub to store your files and a built-in version of DuckDB to query your data.

### Explore Live Sample Notebooks

The best way to learn is to see Malloy in action. We have created several sample repositories with data and pre-built notebooks.

1.  **Go to a sample repository**, for example:
    * [Auto Recalls](https://github.com/malloydata/malloy-samples/tree/main/duckdb/auto_recalls) - Recall data from Data.gov.
    * [Baby Names](https://github.com/malloydata/malloy-samples/tree/main/duckdb/babynames) - Common baby names by decade.
    * [Plane Tracker](https://github.com/malloydata/malloy-samples/tree/main/duckdb/flights) - Map/Reduce example tracking individual airplanes.
2.  Once you are on the GitHub page, **press the `.` (period) key** on your keyboard.
3.  This will open the repository in a VS Code interface directly in your browser (`github.dev`). If you don't have the Malloy extension installed, it will prompt you to install it.
4.  Open a file with the `.malloynb` extension and click **Run All** at the top to see the live dashboard.

> **[DELETE THIS BLOCK AND INSERT GIF]**
> **Instructions for GIF:**
> 1. Start recording on a GitHub repo page (e.g., Malloy Samples/Auto Recalls).
> 2. Show the '.' key being pressed.
> 3. Capture the screen transitioning to the VS Code web editor interface.
> 4. Animate the cursor moving to and clicking the "Run All" button at the top of a notebook.
> 5. Show the dashboard rendering in the preview pane on the right.

### Local Setup (Optional)

For local development, you will need to [install the Malloy extension from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=malloydata.malloy). This provides syntax highlighting, live previews, and the schema explorer for projects on your machine.

---

## 3. Creating Your First Notebook from Scratch

Ready to create your own dashboard? Follow these steps to build a notebook in the browser.

1.  **Create a new GitHub Repository:** Start by creating a new, empty repository in your GitHub account.
2.  **Upload Data:** In your new repository, use the **Add file > Upload files** button to upload a `CSV`, `Parquet`, or `JSON` file. This will be the data source for your dashboard.
3.  **Open the Web Editor:** Once your data file is committed, press the `.` (period) key to open the `github.dev` web editor.
4.  **Create a Notebook File:**
    * From the menu, select **File > New File**.
    * Give your new file a name with the extension `.malloynb` (e.g., `my_dashboard.malloynb`).
5.  **Build Your Notebook:** You can now start adding content (code and Markdown cells) to your notebook file, as described in the next section.

---

## 4. The Structure of a Malloy Notebook

A Malloy notebook is a single `.malloynb` file that combines code and text. The notebook is composed of cells that execute sequentially.

> **[DELETE THIS BLOCK AND INSERT SCREENSHOT]**
> **Instructions for Screenshot:**
> 1. Take a full-screen screenshot of the VS Code window with a `.malloynb` file open.
> 2. Use arrows or numbered boxes to annotate the following four areas:
>    - The `import "..."` statement at the top.
>    - A Markdown cell with narrative text.
>    - A Malloy query cell with code.
>    - The rendered dashboard in the live preview panel.

### How Cells Build on Each Other

Each code cell in a notebook inherits all the definitions from the cells above it. This allows you to build up your analysis step-by-step. For example, you can define a data source in the first cell and then query it in the second.

**Cell 1: Define a Source**
```malloy
source: products is duckdb.table('products.csv')
```

**Cell 2: Query the Source**
```malloy
run: products -> {
  group_by: category
  aggregate: product_count is count()
}
```

### Import Statement
For larger projects, you will define your data models in separate `.malloy` files. To use a governed model in your notebook, start with an import statement. This makes all the dimensions, measures, and views from the model available.

```malloy
import "autorecalls.malloy"
```

### Malloy Query Cells
Each code cell contains a Malloy query. You can:

*   **Reference Predefined Views:** Easily run queries already defined in your model.
    ```malloy
    run: recall_dashboard
    ```
*   **Build New Queries:** Write new queries from scratch.
*   **Modify Existing Views:** Add clauses like `limit` or `where` to refine existing views.
    ```malloy
    run: recall_dashboard { limit: 3 }
    ```

### Markdown Cells
Woven between the code cells is standard Markdown. This is where you build the narrative of your data story. Use Markdown to add titles, explanations, images, and commentary to turn a series of queries into a cohesive analysis.

### Styling Your Results
You can apply visual styles to rendered cells by placing a style comment on the last line of a query cell. This allows you to create rich layouts like dashboards.

```malloy
run: products -> {
  group_by: category
  aggregate: product_count is count()
  nest: products_by_brand is {
    group_by: brand_name
    aggregate: product_count is count()
  }
}
// style: 'dashboard'
```

---

## 5. Local Development and Publishing

### The Development Loop
The Malloy VS Code extension (both locally and in the browser) provides a powerful and efficient development experience with a fast feedback loop.

*   **Live Preview:** As you build, you can see a live preview of the rendered dashboard.
*   **Run All:** Click the **Run All** button at the top of the notebook to execute every cell.
*   **Run a Single Cell:** For instant feedback, run cells one at a time.
*   **Schema Explorer:** When editing a Malloy code cell, the Schema panel on the left shows all available fields and views from your model, making it easy to build new queries.

> **[DELETE THIS BLOCK AND INSERT SCREENSHOT]**
> **Instructions for Screenshot:**
>
> Take a screenshot focusing on the left-hand side of the VS Code window.
>
> Clearly show the "Schema Explorer" panel.
>
> Highlight the lists of "Dimensions" and "Measures".
>
> (Optional) Use an arrow to show a field being clicked and added to the query in the editor.

### Publishing with Malloy Publisher
Once you have refined your dashboard, you can serve it with Malloy Publisher so others can access it as a live, interactive data experience.

*   **Start the Publisher Server:** From your project's terminal, run the command:
    ```bash
    malloy-publisher
    ```
*   **View Your Published Notebook:**
    *   Open the provided local URL in your web browser.
    *   Navigate to the `.malloynb` file you were working on.
*   Publisher renders your notebook as a live data experience, where each query is executed in real-time.