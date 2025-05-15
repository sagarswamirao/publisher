# Creating a Publisher Docker Image

There are 2 docker files in the repo. A base `production.docker` which creates the base image and `malloy-samples.docker` which is layered on top and copies the malloy samples into the Docker image so they can be served by the publisher.

To create a Docker image for your own packages, follow the example of `docker/malloy-samples.docker` which copies in the publisher config and malloy files.

## To create & run the malloy-samples Docker image:

1. Clone the Publisher repository + malloy-sample submodule as outline in the README.

2. Build the Docker imagee using the provided Dockerfiles:

   ```bash
   docker build -t malloy-publisher:latest -f docker/production.docker .
   docker build -t malloy-samples:latest -f docker/malloy-samples.docker .
   ```

3. Run the Docker container.
   The Publisher server runs at port 4000, the MCP server at port 4040.

   ```bash
   docker run -p 4000:4000 -p 4040:4040 malloy-samples:latest
   ```

4. (Optional) For BigQuery access, mount your GCP credentials.
   Note that you cannot use personal credentials- only service account credentials can be used in the docker image.

```bash
docker run -p 4000:4000 -p 4040:4040 \
  -v /path/to/your/service_credentials.json:/app/gcp-credentials/key.json \
  malloy-samples:latest
```
