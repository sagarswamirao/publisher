# Publisher: The Malloy Semantic Model Server

[![build](https://github.com/malloydata/publisher/actions/workflows/build.yml/badge.svg)](https://github.com/malloydata/publisher/actions/workflows/build.yml)

Welcome to Publisher, the open-source semantic model server for the [Malloy](link-to-malloy-project) data language.

**What is Malloy?**
[Malloy](link-to-malloy-project) is an innovative open-source language specifically created for describing data structures, relationships, and transformations. Crucially, Malloy allows you to build rich **semantic models** – defining the *meaning*, *relationships*, and *context* behind your data directly within the language.

Malloy provides a robust framework to encode the business context alongside your data structures and running queries against your databases. The accompanying [VS Code extension](link-to-vscode-extension) provides a rich environment for developing these crucial Malloy models, exploring data, and building simple dashboards.

This explicit definition of meaning is becoming essential as AI agents become primary consumers of enterprise data. AI lacks human contextual understanding. Without a clear semantic layer defining concepts consistently (e.g., is 'revenue' GAAP revenue, bookings, or contracted ARR?), AI can easily misinterpret data pulled from various sources, leading to inaccurate or nonsensical results.

**What is Publisher?**
Publisher takes the semantic models defined in Malloy – models rich with business context and meaning – and exposes them through a server interface. This allows applications, **AI agents**, tools, and users to query your data consistently and reliably, leveraging the shared, unambiguous understanding defined in the Malloy model.

**The Goal:**
Publisher is a critical piece of the larger vision to enable the next generation of data and AI applications. The semantic layer is rapidly becoming the most strategic part of the modern data stack – it's the keystone that unlocks the true potential of data warehouses and AI models by ensuring accuracy, consistency, and preventing costly misinterpretations.

Malloy and Publisher aim to provide an open-source, developer-centric, and powerful platform for building, managing, and *serving* semantic models. Our goal is to create a trustworthy foundation for both human analysis and reliable AI-driven insights, offering a compelling, open alternative to proprietary systems like Looker.

## Architecture Overview

Publisher provides a way to serve, explore, and interact with Malloy semantic models, making them readily available for both human analysis and AI consumption. It consists of three main components: the Publisher Server (backend, now including MCP support), the Publisher SDK (UI components), and the Publisher App (a reference implementation).

The diagram below illustrates how these components interact, including the pathway for AI agents via MCP:

TODO(knesbit): diagram

**1. Publisher Server (`packages/server/`)**

* **Core Backend:** This is the heart of Publisher. It's a server application responsible for loading and managing Malloy Packages, which encapsulate your semantic models.
* **Malloy Integration:** It utilizes the Malloy runtime to parse `.malloy` files, understand the rich semantic models defined within them (including relationships, calculations, and business context), and compile Malloy queries into SQL for execution against target databases (BigQuery, Postgres, DuckDB).
* **Malloy Package Format:** The Publisher Server loads semantic models, notebooks, and transformations based on the Malloy Package format. This format is designed to integrate seamlessly with standard developer practices.
    * **Goal: Scalability and Governance through Standard Practices:** Enable engineers to manage, version, test, and distribute their data transformations and semantic models using familiar workflows (local development, CI/CD) and distribution mechanisms (e.g., packages, container images, registries). This aims to scale data development far beyond the limitations of current ad-hoc approaches. Crucially, leveraging these standard software engineering practices provides a natural form of **governance**. When a versioned package is pushed by a trusted source to a central repository or registry, that specific version effectively becomes the blessed or "governed" definition for consumption. This contrasts sharply with the complex, often bespoke processes required by traditional data catalogs or BI tools to achieve similar levels of trust and governance for data assets.
    * **Structure:** A Malloy package is currently defined as a directory containing:
        * One or more `.malloy` files defining data models, queries, and transformations.
        * Optionally, one or more `.malloynb` files (Malloy Notebooks) for ad hoc analysis, exploration, and dashboard-like presentation.
        * A `publisher.json` manifest file.
    * **Manifest (`publisher.json`):** Contains metadata about the package. Currently, it supports `name` and `description` fields. This schema will be expanded significantly as Publisher evolves to better support dependency management, versioning, and integration with package/container registries, further strengthening the governance model.
* **API Layers:** The Publisher server exposes two primary API interfaces:
    * **REST API:**
        * **Endpoint:** `/api/v0` (running on port defined by `PUBLISHER_PORT`, default `4000`)
        * **Host:** Defined by `PUBLISHER_HOST` (default `localhost`)
        * **Purpose:** Used by the web frontend (Publisher App/SDK) for browsing packages, models, and executing queries.
        * **Specification:** Defined in [`api-doc.yaml`](api-doc.yaml).
        * **Authentication:** None.
    * **Model Context Protocol (MCP) API:**
        * **Endpoint:** `/mcp` (running on port defined by `MCP_PORT`, default `4040`)
        * **Host:** Defined by `PUBLISHER_HOST` (default `localhost`)
        * **Purpose:** Allows AI agents and other MCP clients (like the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or compatible applications) to interact with Malloy resources (projects, packages, models, sources, views, notebooks) and execute queries programmatically.
        * **Specification:** Adheres to the [MCP `2025-03-26` specification revision](https://modelcontextprotocol.io/specification/2025-03-26/). This includes providing resource metadata and detailed error messages with suggestions.
        * **Transport:** Uses the `StreamableHttpServerTransport` defined in the specification, requiring compatible MCP clients.
        * **Authentication:** None.
        * **Compatibility:** This implementation uses the modern `StreamableHttpServerTransport` and is **not** backward compatible with older clients expecting the deprecated SSE transport ([Source: MCP SSE Transport Deprecation](https://mcp-framework.com/docs/Transports/sse/)).
        * **Usage:** To connect an MCP client, point it to `http://<PUBLISHER_HOST>:<MCP_PORT>/mcp`. See the [MCP Documentation](https://modelcontextprotocol.io/) for client examples.

**2. Publisher SDK (`packages/sdk/`)**

* **UI Component Library:** A collection of reusable React components designed for building user interfaces that interact with a Publisher Server's *RESTful API*.
* **Embeddable:** Intended to be imported and used within other React-based data applications, allowing developers to easily add Malloy model browsing and querying capabilities for human users.
* **Server Communication:** Handles fetching data and sending query requests to the Publisher Server's REST APIs.

**3. Publisher App (`packages/app/`)**

* **Reference Implementation:** A standalone web application built using the Publisher SDK.
* **Functionality:** Allows users to connect to a running Publisher Server instance (via the REST API), browse the available Malloy packages and their contents, and generate embeddable code snippets.
* **Purpose:** Serves as a practical example of how to use the SDK and provides a useful tool for local development and exploration by human analysts.

**4. Potential MCP-Powered Applications**

The Publisher Server, with its MCP interface exposing Malloy semantic models, enables a new class of data-driven applications, particularly those leveraging AI:

* **AI Data Analysts:** Autonomous agents that can connect to the MCP server, understand the available business metrics and dimensions defined in Malloy, ask complex analytical questions (e.g., "What were the main drivers of customer churn last quarter by region?"), and generate reports or insights based on the semantically consistent data retrieved.
* **Context-Aware Chatbots:** Customer service or internal support chatbots that can query the semantic layer via MCP to answer specific data-related questions accurately (e.g., "What's the current inventory level for product SKU 12345?" or "What is the ARR for customer X?").
* **Automated Reporting & Alerting:** Systems that monitor key metrics defined in the Malloy models via MCP and automatically generate reports or trigger alerts when certain thresholds or anomalies are detected, with full confidence in the definition of the metrics being monitored.
* **Data Quality Validation:** Tools that use the semantic model definitions accessed via MCP to automatically validate data in the underlying warehouse against the expected business rules and definitions.
* **Enhanced BI Tools:** Future BI tools could potentially use MCP as a standard way to connect to semantic layers like Publisher, offering users a more reliable and consistent view of data across different platforms.

## Publisher App Screenshots

TODO(kjnesbit): Replace with a demo video.

<center>
    <figcaption>Browse loaded packages</figcaption>
    <img src="project-screenshot.png" width=800>
</center>
<br>
<center>
    <figcaption>Explore a package's contents</figcaption>
    <img src="package-screenshot.png" width=800>
</center>
<br>
<center>
    <figcaption>Explore Malloy models and notebooks</figcaption>
    <img src="notebook-screenshot.png" width=800>
</center>

## Build and Run Instructions

To build and run the package server, first load the malloy-samples.
```
git submodule init
git submodule update
```

Then build and run the package server:
```
bun install
bun run build
bun run start
```

Running the BigQuery malloy-samples requires GCP application default credentials.
```
gcloud auth login --update-adc
gcloud config set project {my_project_id} --installation
```

## Server Configuration

TODO(kjnesbit): Add sever configuration information.

### Upgrading Malloy dependencies
To update to a new NPM release of `@malloydata/*`:
```
bun run upgrade-malloy 0.0.XXX #XXX is the new version number
bun install # This updates node_modules
```

> **_NOTE:_**  Note that the Publisher repository currently points to a [fork](https://github.com/pathwaysdata/malloy-samples) of the [malloy-samples](https://github.com/malloydata/malloy-samples) repo.  The fork contains minor changes to turn each Malloy sample directory into a package.  Once the package format solidifies, we intend to merge the changes into the main malloy-samples repo.

## Coming Soon

* Developer mode that automatically recompiles models and refreshes the publisher app as you make changes
* Embed Composer's [Explore UI](https://github.com/malloydata/malloy-composer) to enable ad hoc anslysis of packages via a UI
* Scheduled transform pipelines
* Dockerfile and images 
* DBT integration
* Ariflow integration

## Join the Malloy Community

- Join our [**Malloy Slack Community!**](https://join.slack.com/t/malloy-community/shared_invite/zt-1kgfwgi5g-CrsdaRqs81QY67QW0~t_uw) Use this community to ask questions, meet other Malloy users, and share ideas with one another.
- Use [**GitHub issues**](https://github.com/malloydata/publisher/issues) in this Repo to provide feedback, suggest improvements, report bugs, and start new discussions.

## Resources

Documentation:

- [Malloy Language](https://malloydata.github.io/malloy/documentation/language/basic.html) - A quick introduction to the language
- [eCommerce Example Analysis](https://malloydata.github.io/malloy/documentation/examples/ecommerce.html) - a walkthrough of the basics on an ecommerce dataset (BigQuery public dataset)
- [Modeling Walkthrough](https://malloydata.github.io/malloy/documentation/examples/iowa/iowa.html) - introduction to modeling via the Iowa liquor sales public data set (BigQuery public dataset)
- [YouTube](https://www.youtube.com/channel/UCfN2td1dzf-fKmVtaDjacsg) - Watch demos / walkthroughs of Malloy
