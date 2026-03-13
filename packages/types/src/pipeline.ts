/**
 * Pipeline definitions: the YAML-driven pipeline configuration model.
 * Pipelines define the processing flow from source through stages to destinations.
 */

export type StageType =
  | 'hl7v2-parse'
  | 'x12-parse'
  | 'fhir-parse'
  | 'cda-parse'
  | 'csv-parse'
  | 'auto-parse'
  | 'auto-classify'
  | 'filter'
  | 'hl7v2-to-fhir'
  | 'x12-to-fhir'
  | 'cda-to-fhir'
  | 'csv-to-fhir'
  | 'custom-map'
  | 'terminology-lookup'
  | 'deduplicate'
  | 'data-quality'
  | 'transform';

export type SourceType = 'mllp' | 'http' | 'sftp' | 'fhir-subscription' | 'webhook' | 'database' | 'queue';
export type DestinationType = 'internal-store' | 'fhir-rest' | 'webhook' | 'sftp' | 'database' | 'queue' | 'mllp';

export interface FilterRule {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'regex' | 'exists' | 'gt' | 'lt';
  values?: string[];
  value?: string | number | boolean;
}

export interface TriggerRule {
  event: string;
  actions: TriggerAction[];
}

export interface TriggerAction {
  type: 'route' | 'notify' | 'webhook' | 'transform';
  /** Destination IDs or notification channel names */
  targets: string[];
  config?: Record<string, unknown>;
}

export interface PipelineStage {
  id: string;
  type: StageType;
  config: Record<string, unknown>;
  /** Condition to skip this stage */
  when?: FilterRule[];
  /** Continue pipeline even if this stage fails */
  continueOnError?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

export interface PipelineSource {
  type: SourceType;
  config: Record<string, unknown>;
}

export interface PipelineDestination {
  id: string;
  type: DestinationType;
  config: Record<string, unknown>;
  /** Only route to this destination when filter matches */
  filter?: FilterRule[];
}

export interface PipelineDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** Tenant that owns this pipeline */
  tenantId: string;

  source: PipelineSource;
  stages: PipelineStage[];
  destinations: PipelineDestination[];
  triggers?: TriggerRule[];

  /** Whether this pipeline is active */
  enabled: boolean;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type PipelineStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export interface PipelineState {
  pipelineId: string;
  status: PipelineStatus;
  /** Messages processed in last 24h */
  messagesProcessed24h: number;
  /** Current error rate (0.0 - 1.0) */
  errorRate: number;
  /** Average processing latency in ms */
  avgLatencyMs: number;
  lastMessageAt?: string;
  lastErrorAt?: string;
  lastError?: string;
}
