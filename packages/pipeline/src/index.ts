import YAML from 'yaml';
import type {
  PipelineDefinition,
  PipelineStage,
  FilterRule,
  Envelope,
  EnvelopeStage,
  LineageEntry,
  ProcessingError,
} from '@connect/types';
import { createHash } from 'node:crypto';

export const VERSION = '0.1.0';

/**
 * A stage processor function. Takes an envelope, returns the updated envelope.
 */
export type StageProcessor = (envelope: Envelope, stage: PipelineStage) => Promise<Envelope>;

/**
 * Registry of stage processors by stage type.
 */
export class StageRegistry {
  private processors = new Map<string, StageProcessor>();

  register(stageType: string, processor: StageProcessor): void {
    this.processors.set(stageType, processor);
  }

  get(stageType: string): StageProcessor | undefined {
    return this.processors.get(stageType);
  }

  has(stageType: string): boolean {
    return this.processors.has(stageType);
  }

  get registeredTypes(): string[] {
    return Array.from(this.processors.keys());
  }
}

/**
 * Parse a YAML pipeline definition into a PipelineDefinition.
 */
export function parsePipelineYAML(yaml: string): PipelineDefinition {
  const doc = YAML.parse(yaml);
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid pipeline YAML: document must be an object');
  }
  if (!doc.name) {
    throw new Error('Invalid pipeline YAML: missing required field "name"');
  }
  if (!doc.stages || !Array.isArray(doc.stages)) {
    throw new Error('Invalid pipeline YAML: missing or invalid "stages" array');
  }
  if (!doc.source || typeof doc.source !== 'object') {
    throw new Error('Invalid pipeline YAML: missing or invalid "source" object');
  }

  return {
    id: doc.id ?? '',
    name: doc.name,
    version: doc.version ?? '1.0.0',
    description: doc.description,
    tenantId: doc.tenantId ?? '',
    source: doc.source,
    stages: doc.stages.map((s: Record<string, unknown>, i: number) => ({
      id: s.id ?? `stage-${i}`,
      type: s.type,
      config: s.config ?? {},
      when: s.when,
      continueOnError: s.continueOnError ?? false,
      timeoutMs: s.timeoutMs,
    })),
    destinations: doc.destinations ?? [],
    triggers: doc.triggers,
    enabled: doc.enabled ?? true,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
    createdBy: doc.createdBy ?? 'system',
  };
}

/**
 * Evaluate a filter rule against a value.
 */
export function evaluateFilter(rule: FilterRule, value: unknown): boolean {
  const strValue = String(value ?? '');
  switch (rule.operator) {
    case 'eq':
      return strValue === (rule.value != null ? String(rule.value) : rule.values?.[0] ?? '');
    case 'neq':
      return strValue !== (rule.value != null ? String(rule.value) : rule.values?.[0] ?? '');
    case 'in':
      return rule.values?.includes(strValue) ?? false;
    case 'not_in':
      return !(rule.values?.includes(strValue) ?? false);
    case 'contains':
      return strValue.includes(String(rule.value ?? ''));
    case 'regex':
      return new RegExp(String(rule.value ?? '')).test(strValue);
    case 'exists':
      return value != null && value !== '';
    case 'gt':
      return Number(strValue) > Number(rule.value ?? 0);
    case 'lt':
      return Number(strValue) < Number(rule.value ?? 0);
    default:
      return false;
  }
}

/**
 * Resolve a dot-notation field path from an envelope.
 * e.g., "parsed.format" -> envelope.parsed.format
 */
export function resolveField(envelope: Envelope, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = envelope;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Check if a stage should be skipped based on its `when` conditions.
 */
export function shouldSkipStage(envelope: Envelope, stage: PipelineStage): boolean {
  if (!stage.when || stage.when.length === 0) return false;
  // All conditions must match for the stage to execute (AND logic)
  // If any condition fails, the stage is skipped
  return !stage.when.every(rule => {
    const value = resolveField(envelope, rule.field);
    return evaluateFilter(rule, value);
  });
}

/**
 * Create a lineage entry recording a stage execution.
 */
export function createLineageEntry(
  stage: EnvelopeStage,
  transformId: string,
  input: string,
  output: string,
  durationMs: number,
): LineageEntry {
  return {
    stage,
    timestamp: new Date().toISOString(),
    transformId,
    transformVersion: VERSION,
    inputHash: sha256(input),
    outputHash: sha256(output),
    durationMs,
  };
}

/**
 * Create a processing error.
 */
export function createProcessingError(
  stage: EnvelopeStage,
  error: unknown,
  retryCount: number = 0,
): ProcessingError {
  return {
    stage,
    code: error instanceof Error && 'code' in error ? String((error as { code: string }).code) : 'STAGE_ERROR',
    message: error instanceof Error ? error.message : String(error),
    stack: process.env['NODE_ENV'] !== 'production' && error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    retryable: true,
    retryCount,
  };
}

/**
 * Execute a pipeline's stages sequentially against an envelope.
 */
export async function executePipeline(
  definition: PipelineDefinition,
  envelope: Envelope,
  registry: StageRegistry,
): Promise<Envelope> {
  let current = { ...envelope };

  for (const stage of definition.stages) {
    // Check skip conditions
    if (shouldSkipStage(current, stage)) {
      continue;
    }

    const processor = registry.get(stage.type);
    if (!processor) {
      if (stage.continueOnError) continue;
      throw new Error(`No processor registered for stage type: ${stage.type}`);
    }

    const startTime = Date.now();
    const inputSnapshot = JSON.stringify(current);

    try {
      // Execute with optional timeout
      if (stage.timeoutMs) {
        current = await withTimeout(processor(current, stage), stage.timeoutMs);
      } else {
        current = await processor(current, stage);
      }

      const outputSnapshot = JSON.stringify(current);
      const durationMs = Date.now() - startTime;

      // Record lineage
      current = {
        ...current,
        lineage: [
          ...current.lineage,
          createLineageEntry(current.stage, stage.id, inputSnapshot, outputSnapshot, durationMs),
        ],
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const procError = createProcessingError(current.stage, error, current.errors.filter(e => e.stage === current.stage).length);

      if (stage.continueOnError) {
        current = {
          ...current,
          errors: [...current.errors, procError],
          updatedAt: new Date().toISOString(),
        };
        continue;
      }

      // Stage failed, mark envelope as failed
      current = {
        ...current,
        stage: 'failed',
        errors: [...current.errors, procError],
        updatedAt: new Date().toISOString(),
      };
      break;
    }
  }

  return current;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Stage timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}
