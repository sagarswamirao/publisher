# Malloy Publisher SDK

The Malloy Publisher SDK is a comprehensive toolkit designed to facilitate the development and testing of Malloy packages.

## K6 Test Presets

The Malloy Publisher SDK includes several K6 test presets to help you test the performance and stability of the Malloy publisher server. 

Below is a list of the available test presets:

### Smoke Test
Basic functionality test with minimal load.
- **File:**
    
    `node_modules/@malloy-publisher/sdk/k6-tests/smoke-test.ts`
- **Virtual Users:** 1
- **Duration:** 1 minute
- **95th Percentile Response Time:** < 500ms
- **Error Rate:** < 1%

### Load Test
Testing system under normal load.
- **File:**
    
    `node_modules/@malloy-publisher/sdk/k6-tests/load-test.ts`
- **Virtual Users:** 50
- **Duration:** 5 minutes
- **95th Percentile Response Time:** < 1s
- **Error Rate:** < 5%

### Stress Test
Testing system under extreme load.
- **File:**

    `node_modules/@malloy-publisher/sdk/k6-tests/stress-test.ts`
- **Virtual Users:** 100
- **Duration:** 10 minutes
- **95th Percentile Response Time:** < 2s
- **Error Rate:** < 10%

### Spike Test
Testing system under sudden spikes of load.
- **File:**
    
    `node_modules/@malloy-publisher/sdk/k6-tests/spike-test.ts`
- **Stages:**
  - 2 minutes ramp-up to 100 users
  - 1 minute at 100 users
  - 2 minutes ramp-down to 0 users
- **95th Percentile Response Time:** < 2s
- **Error Rate:** < 10%

### Breakpoint Test
Testing system to find its breaking point.
- **File:**
    
    `node_modules/@malloy-publisher/sdk/k6-tests/breakpoint-test.ts`
- **Stages:**
  - 2 minutes at 50 users
  - 2 minutes at 100 users
  - 2 minutes at 150 users
  - 2 minutes at 200 users
  - 2 minutes ramp-down to 0 users
- **95th Percentile Response Time:** < 3s
- **Error Rate:** < 15%

### Soak Test
Testing system under sustained load.
- **File:**
    
    `node_modules/@malloy-publisher/sdk/k6-tests/soak-test.ts`
- **Virtual Users:** 10
- **Duration:** 1 hour
- **95th Percentile Response Time:** < 1s
- **Error Rate:** < 1%

You can run these presets using the K6 testing tool to ensure your system performs well under different load conditions.

For example, this command will run a smoke test against your localhost:
```sh
k6 run node_modules/@malloy-publisher/sdk/k6-tests/smoke-test.ts \
    --env PUBLISHER_URL=http://localhost:4000 \
    --env SIDECAR_URL=http://localhost:4001
```

## OpenTelemetry Integration

The K6 tests can be configured to export metrics to OpenTelemetry collectors using the experimental OpenTelemetry output. This allows you to integrate K6 metrics with your observability stack.

For more information on how to configure OpenTelemetry collectors, please refer to the official documentation: [K6 OpenTelemetry Integration](https://grafana.com/docs/k6/latest/results-output/real-time/opentelemetry/)
