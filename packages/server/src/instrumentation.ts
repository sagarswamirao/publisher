import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
   ATTR_SERVICE_NAME,
   ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { logger } from "./logger";

function instrument() {
   const otelCollectorUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
   if (!otelCollectorUrl) {
      logger.info("No OTLP collector URL found, skipping instrumentation");
      return;
   }

   logger.info(
      `Initializing OpenTelemetry SDK with OTLP collector at ${otelCollectorUrl}`,
   );
   const traceExporter = new OTLPTraceExporter({
      url: `${otelCollectorUrl}/v1/traces`,
      headers: {},
   });
   const metricExporter = new OTLPMetricExporter({
      url: `${otelCollectorUrl}/v1/metrics`,
      headers: {},
   });
   const logExporter = new OTLPLogExporter({
      url: `${otelCollectorUrl}/v1/logs`,
      headers: {},
   });

   const sdk = new NodeSDK({
      serviceName: "publisher",
      resource: resourceFromAttributes({
         [ATTR_SERVICE_NAME]: "publisher",
         [ATTR_SERVICE_VERSION]: "1.0.0",
      }),
      autoDetectResources: true,
      traceExporter: traceExporter,
      metricReader: new PeriodicExportingMetricReader({
         exporter: metricExporter,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
      spanProcessors: [new BatchSpanProcessor(traceExporter)],
      logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
   });

   sdk.start();
   logger.info("Initialized OpenTelemetry SDK");
}

instrument();
