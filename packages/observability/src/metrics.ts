import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

// ─── Pipeline Metrics ───────────────────────────────────────────────────────

export const messagesReceived = new Counter({
  name: 'connect_messages_received_total',
  help: 'Total messages received by source',
  labelNames: ['tenant_id', 'source_id', 'format'] as const,
  registers: [registry],
});

export const messagesProcessed = new Counter({
  name: 'connect_messages_processed_total',
  help: 'Total messages processed by stage',
  labelNames: ['tenant_id', 'pipeline_id', 'stage', 'status'] as const,
  registers: [registry],
});

export const processingDuration = new Histogram({
  name: 'connect_processing_duration_seconds',
  help: 'Message processing duration per stage',
  labelNames: ['tenant_id', 'pipeline_id', 'stage'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [registry],
});

export const messagesInFlight = new Gauge({
  name: 'connect_messages_in_flight',
  help: 'Messages currently being processed',
  labelNames: ['tenant_id', 'pipeline_id', 'stage'] as const,
  registers: [registry],
});

export const messageErrors = new Counter({
  name: 'connect_message_errors_total',
  help: 'Total message processing errors',
  labelNames: ['tenant_id', 'pipeline_id', 'stage', 'error_code'] as const,
  registers: [registry],
});

// ─── Data Quality Metrics ───────────────────────────────────────────────────

export const qualityScoreHistogram = new Histogram({
  name: 'connect_quality_score',
  help: 'Data quality scores distribution',
  labelNames: ['tenant_id', 'resource_type', 'dimension'] as const,
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [registry],
});
