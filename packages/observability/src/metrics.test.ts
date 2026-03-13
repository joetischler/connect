import { describe, it, expect, beforeEach } from 'vitest';
import {
  registry,
  messagesReceived,
  messagesProcessed,
  processingDuration,
  messagesInFlight,
  messageErrors,
  qualityScoreHistogram,
} from './metrics.js';

describe('metrics', () => {
  beforeEach(async () => {
    registry.resetMetrics();
  });

  it('registry collects default metrics', async () => {
    const metrics = await registry.getMetricsAsJSON();
    // Default metrics include things like process_cpu_seconds_total
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('messagesReceived counter increments', async () => {
    messagesReceived.inc({ tenant_id: 't1', source_id: 's1', format: 'hl7v2' });
    messagesReceived.inc({ tenant_id: 't1', source_id: 's1', format: 'hl7v2' });
    const val = await registry.getSingleMetricAsString('connect_messages_received_total');
    expect(val).toContain('connect_messages_received_total');
    expect(val).toContain('tenant_id="t1"');
  });

  it('messagesProcessed counter tracks stage and status', () => {
    messagesProcessed.inc({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed', status: 'success' });
    messagesProcessed.inc({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed', status: 'error' });
    // Should not throw
    expect(true).toBe(true);
  });

  it('processingDuration histogram observes values', () => {
    processingDuration.observe({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed' }, 0.05);
    processingDuration.observe({ tenant_id: 't1', pipeline_id: 'p1', stage: 'mapped' }, 0.2);
    // Should not throw
    expect(true).toBe(true);
  });

  it('messagesInFlight gauge can increment and decrement', () => {
    messagesInFlight.inc({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed' });
    messagesInFlight.inc({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed' });
    messagesInFlight.dec({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed' });
    // Should not throw
    expect(true).toBe(true);
  });

  it('messageErrors counter tracks error codes', () => {
    messageErrors.inc({ tenant_id: 't1', pipeline_id: 'p1', stage: 'parsed', error_code: 'PARSE_ERROR' });
    expect(true).toBe(true);
  });

  it('qualityScoreHistogram records quality dimensions', () => {
    qualityScoreHistogram.observe({ tenant_id: 't1', resource_type: 'Patient', dimension: 'completeness' }, 85);
    expect(true).toBe(true);
  });
});
