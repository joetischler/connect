import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, type Tracer } from '@opentelemetry/api';

let sdk: NodeSDK | null = null;

export function initTracing(serviceName: string): void {
  const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

  if (!otlpEndpoint) {
    return; // Tracing disabled if no endpoint configured
  }

  sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
  });

  sdk.start();
}

export function getTracer(name: string): Tracer {
  return trace.getTracer(name);
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
