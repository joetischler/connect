import { describe, it, expect } from 'vitest';
import {
  parsePipelineYAML,
  evaluateFilter,
  resolveField,
  shouldSkipStage,
  StageRegistry,
  executePipeline,
  createProcessingError,
} from './index.js';
import type { Envelope, PipelineStage, FilterRule } from '@connect/types';

// Helper to create a minimal test envelope
function makeEnvelope(overrides?: Partial<Envelope>): Envelope {
  return {
    id: '01HQTEST000000000000000000',
    tenantId: 'tenant-1',
    pipelineId: 'pipeline-1',
    sourceId: 'source-1',
    traceId: 'trace-123',
    stage: 'ingested',
    raw: {
      contentRef: 's3://bucket/msg.hl7',
      contentType: 'application/hl7-v2',
      receivedAt: '2024-01-15T12:00:00Z',
      sourceMetadata: { protocol: 'mllp' },
    },
    lineage: [],
    errors: [],
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    ...overrides,
  };
}

describe('parsePipelineYAML', () => {
  it('parses a valid pipeline definition', () => {
    const yaml = `
name: ADT Pipeline
version: "1.0.0"
description: Processes ADT messages
source:
  type: mllp
  config:
    port: 2575
stages:
  - id: parse
    type: hl7v2-parse
    config: {}
  - id: classify
    type: auto-classify
    config: {}
destinations:
  - id: fhir-store
    type: internal-store
    config: {}
`;
    const def = parsePipelineYAML(yaml);
    expect(def.name).toBe('ADT Pipeline');
    expect(def.version).toBe('1.0.0');
    expect(def.description).toBe('Processes ADT messages');
    expect(def.source.type).toBe('mllp');
    expect(def.stages).toHaveLength(2);
    expect(def.stages[0].id).toBe('parse');
    expect(def.stages[0].type).toBe('hl7v2-parse');
    expect(def.stages[1].type).toBe('auto-classify');
    expect(def.destinations).toHaveLength(1);
    expect(def.enabled).toBe(true);
  });

  it('uses defaults for optional fields', () => {
    const yaml = `
name: Minimal Pipeline
source:
  type: http
  config:
    path: /ingest
stages:
  - type: hl7v2-parse
`;
    const def = parsePipelineYAML(yaml);
    expect(def.version).toBe('1.0.0');
    expect(def.stages[0].id).toBe('stage-0');
    expect(def.stages[0].continueOnError).toBe(false);
    expect(def.enabled).toBe(true);
  });

  it('rejects YAML without a name', () => {
    expect(() => parsePipelineYAML('stages: []')).toThrow('missing required field "name"');
  });

  it('rejects YAML without stages', () => {
    expect(() => parsePipelineYAML('name: Test\nsource:\n  type: http\n  config: {}')).toThrow('missing or invalid "stages"');
  });

  it('rejects YAML without source', () => {
    expect(() => parsePipelineYAML('name: Test\nstages:\n  - type: parse')).toThrow('missing or invalid "source"');
  });

  it('rejects empty/invalid YAML', () => {
    expect(() => parsePipelineYAML('')).toThrow('Invalid pipeline YAML');
  });
});

describe('evaluateFilter', () => {
  it('eq: matches equal values', () => {
    const rule: FilterRule = { field: 'x', operator: 'eq', value: 'hello' };
    expect(evaluateFilter(rule, 'hello')).toBe(true);
    expect(evaluateFilter(rule, 'world')).toBe(false);
  });

  it('neq: matches unequal values', () => {
    const rule: FilterRule = { field: 'x', operator: 'neq', value: 'hello' };
    expect(evaluateFilter(rule, 'world')).toBe(true);
    expect(evaluateFilter(rule, 'hello')).toBe(false);
  });

  it('in: matches values in list', () => {
    const rule: FilterRule = { field: 'x', operator: 'in', values: ['a', 'b', 'c'] };
    expect(evaluateFilter(rule, 'b')).toBe(true);
    expect(evaluateFilter(rule, 'd')).toBe(false);
  });

  it('not_in: matches values not in list', () => {
    const rule: FilterRule = { field: 'x', operator: 'not_in', values: ['a', 'b'] };
    expect(evaluateFilter(rule, 'c')).toBe(true);
    expect(evaluateFilter(rule, 'a')).toBe(false);
  });

  it('contains: checks substring', () => {
    const rule: FilterRule = { field: 'x', operator: 'contains', value: 'world' };
    expect(evaluateFilter(rule, 'hello world')).toBe(true);
    expect(evaluateFilter(rule, 'hello')).toBe(false);
  });

  it('regex: matches patterns', () => {
    const rule: FilterRule = { field: 'x', operator: 'regex', value: '^ADT' };
    expect(evaluateFilter(rule, 'ADT^A01')).toBe(true);
    expect(evaluateFilter(rule, 'ORU^R01')).toBe(false);
  });

  it('exists: checks for non-null/non-empty', () => {
    const rule: FilterRule = { field: 'x', operator: 'exists' };
    expect(evaluateFilter(rule, 'value')).toBe(true);
    expect(evaluateFilter(rule, null)).toBe(false);
    expect(evaluateFilter(rule, '')).toBe(false);
  });

  it('gt/lt: numeric comparison', () => {
    const gtRule: FilterRule = { field: 'x', operator: 'gt', value: 10 };
    expect(evaluateFilter(gtRule, 15)).toBe(true);
    expect(evaluateFilter(gtRule, 5)).toBe(false);

    const ltRule: FilterRule = { field: 'x', operator: 'lt', value: 10 };
    expect(evaluateFilter(ltRule, 5)).toBe(true);
    expect(evaluateFilter(ltRule, 15)).toBe(false);
  });
});

describe('resolveField', () => {
  it('resolves top-level fields', () => {
    const env = makeEnvelope();
    expect(resolveField(env, 'stage')).toBe('ingested');
    expect(resolveField(env, 'tenantId')).toBe('tenant-1');
  });

  it('resolves nested fields', () => {
    const env = makeEnvelope();
    expect(resolveField(env, 'raw.contentType')).toBe('application/hl7-v2');
    expect(resolveField(env, 'raw.sourceMetadata.protocol')).toBe('mllp');
  });

  it('returns undefined for missing paths', () => {
    const env = makeEnvelope();
    expect(resolveField(env, 'parsed.format')).toBeUndefined();
    expect(resolveField(env, 'nonexistent.path')).toBeUndefined();
  });
});

describe('shouldSkipStage', () => {
  it('does not skip when no conditions', () => {
    const env = makeEnvelope();
    const stage: PipelineStage = { id: 'test', type: 'hl7v2-parse', config: {} };
    expect(shouldSkipStage(env, stage)).toBe(false);
  });

  it('does not skip when all conditions match', () => {
    const env = makeEnvelope();
    const stage: PipelineStage = {
      id: 'test',
      type: 'hl7v2-parse',
      config: {},
      when: [{ field: 'raw.contentType', operator: 'eq', value: 'application/hl7-v2' }],
    };
    expect(shouldSkipStage(env, stage)).toBe(false);
  });

  it('skips when a condition does not match', () => {
    const env = makeEnvelope();
    const stage: PipelineStage = {
      id: 'test',
      type: 'hl7v2-parse',
      config: {},
      when: [{ field: 'raw.contentType', operator: 'eq', value: 'application/fhir+json' }],
    };
    expect(shouldSkipStage(env, stage)).toBe(true);
  });
});

describe('StageRegistry', () => {
  it('registers and retrieves processors', () => {
    const registry = new StageRegistry();
    const processor = async (env: Envelope) => env;
    registry.register('hl7v2-parse', processor);

    expect(registry.has('hl7v2-parse')).toBe(true);
    expect(registry.has('x12-parse')).toBe(false);
    expect(registry.get('hl7v2-parse')).toBe(processor);
  });

  it('lists registered types', () => {
    const registry = new StageRegistry();
    registry.register('a', async (env: Envelope) => env);
    registry.register('b', async (env: Envelope) => env);
    expect(registry.registeredTypes).toEqual(['a', 'b']);
  });
});

describe('executePipeline', () => {
  it('runs stages sequentially', async () => {
    const registry = new StageRegistry();
    const order: string[] = [];

    registry.register('step-a', async (env) => {
      order.push('a');
      return { ...env, stage: 'parsed' as const };
    });
    registry.register('step-b', async (env) => {
      order.push('b');
      return { ...env, stage: 'classified' as const };
    });

    const def = parsePipelineYAML(`
name: Test
source:
  type: http
  config: {}
stages:
  - id: s1
    type: step-a
  - id: s2
    type: step-b
`);

    const result = await executePipeline(def, makeEnvelope(), registry);
    expect(order).toEqual(['a', 'b']);
    expect(result.stage).toBe('classified');
    expect(result.lineage).toHaveLength(2);
  });

  it('marks envelope as failed on stage error', async () => {
    const registry = new StageRegistry();
    registry.register('fail-stage', async () => {
      throw new Error('parse failed');
    });

    const def = parsePipelineYAML(`
name: Failing Pipeline
source:
  type: http
  config: {}
stages:
  - id: s1
    type: fail-stage
`);

    const result = await executePipeline(def, makeEnvelope(), registry);
    expect(result.stage).toBe('failed');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('parse failed');
  });

  it('continues on error when continueOnError is set', async () => {
    const registry = new StageRegistry();
    registry.register('fail-stage', async () => {
      throw new Error('oops');
    });
    registry.register('next-stage', async (env) => {
      return { ...env, stage: 'parsed' as const };
    });

    const def = parsePipelineYAML(`
name: Resilient Pipeline
source:
  type: http
  config: {}
stages:
  - id: s1
    type: fail-stage
    continueOnError: true
  - id: s2
    type: next-stage
`);

    const result = await executePipeline(def, makeEnvelope(), registry);
    expect(result.stage).toBe('parsed');
    expect(result.errors).toHaveLength(1);
  });

  it('skips stages when conditions not met', async () => {
    const registry = new StageRegistry();
    const executed: string[] = [];

    registry.register('stage-a', async (env) => {
      executed.push('a');
      return { ...env, stage: 'parsed' as const };
    });
    registry.register('stage-b', async (env) => {
      executed.push('b');
      return { ...env, stage: 'classified' as const };
    });

    const def = parsePipelineYAML(`
name: Conditional Pipeline
source:
  type: http
  config: {}
stages:
  - id: s1
    type: stage-a
    when:
      - field: raw.contentType
        operator: eq
        value: application/fhir+json
  - id: s2
    type: stage-b
`);

    const result = await executePipeline(def, makeEnvelope(), registry);
    expect(executed).toEqual(['b']);
    expect(result.stage).toBe('classified');
  });

  it('handles timeout', async () => {
    const registry = new StageRegistry();
    registry.register('slow-stage', async (env) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return env;
    });

    const def = parsePipelineYAML(`
name: Timeout Pipeline
source:
  type: http
  config: {}
stages:
  - id: s1
    type: slow-stage
    timeoutMs: 50
`);

    const result = await executePipeline(def, makeEnvelope(), registry);
    expect(result.stage).toBe('failed');
    expect(result.errors[0].message).toContain('timed out');
  });
});

describe('createProcessingError', () => {
  it('creates error from Error instance', () => {
    const err = createProcessingError('parsed', new Error('bad data'));
    expect(err.stage).toBe('parsed');
    expect(err.message).toBe('bad data');
    expect(err.code).toBe('STAGE_ERROR');
    expect(err.retryable).toBe(true);
    expect(err.retryCount).toBe(0);
  });

  it('creates error from string', () => {
    const err = createProcessingError('mapped', 'something broke', 2);
    expect(err.message).toBe('something broke');
    expect(err.retryCount).toBe(2);
  });
});
