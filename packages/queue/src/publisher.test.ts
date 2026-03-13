import { describe, it, expect } from 'vitest';
import { buildSubject } from './publisher.js';

describe('buildSubject', () => {
  it('builds a subject from tenant, pipeline and stage', () => {
    const subject = buildSubject('tenant-1', 'pipeline-abc', 'ingested');
    expect(subject).toBe('connect.tenant-1.pipeline.pipeline-abc.ingested');
  });

  it('supports wildcard tenant and pipeline', () => {
    const subject = buildSubject('*', '*', 'parsed');
    expect(subject).toBe('connect.*.pipeline.*.parsed');
  });

  it('handles all stage types', () => {
    const stages = ['ingested', 'parsed', 'classified', 'filtered', 'mapped', 'normalized', 'routed', 'delivered', 'failed'] as const;
    for (const stage of stages) {
      const subject = buildSubject('t1', 'p1', stage);
      expect(subject).toContain(stage);
      expect(subject).toBe(`connect.t1.pipeline.p1.${stage}`);
    }
  });
});
