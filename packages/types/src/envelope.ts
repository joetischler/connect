/**
 * Envelope: the core message wrapper that flows through every pipeline stage.
 * Every message in the system is wrapped in an Envelope with full lineage tracking.
 */

export type EnvelopeStage =
  | 'ingested'
  | 'parsed'
  | 'classified'
  | 'filtered'
  | 'mapped'
  | 'normalized'
  | 'routed'
  | 'delivered'
  | 'failed';

export interface RawPayload {
  /** Reference to raw bytes in object store (S3/Minio key) */
  contentRef: string;
  /** MIME type: 'application/hl7-v2', 'application/fhir+json', 'application/edi-x12', etc. */
  contentType: string;
  /** ISO 8601 timestamp when the raw message was received */
  receivedAt: string;
  /** Source metadata: IP, port, filename, protocol details */
  sourceMetadata: Record<string, string>;
}

export interface ParsedPayload {
  /** Detected format */
  format: 'hl7v2' | 'x12' | 'fhir' | 'cda' | 'csv' | 'json' | 'xml' | 'unknown';
  /** Structured representation of the parsed message */
  content: unknown;
  /** Parser version used */
  parserVersion: string;
}

export interface Classification {
  /** Detected format */
  format: ParsedPayload['format'];
  /** Confidence score 0.0 - 1.0 */
  confidence: number;
  /** Which detection tier produced this classification */
  tier: 'deterministic' | 'fingerprint' | 'llm';

  /** HL7v2-specific classification details */
  hl7v2?: {
    messageType: string;
    triggerEvent: string;
    version: string;
    sendingApp: string;
    sendingFacility: string;
    vendorProfile?: string;
  };

  /** X12-specific classification details */
  x12?: {
    transactionSet: string;
    version: string;
    senderId: string;
    receiverId: string;
  };

  /** FHIR-specific classification details */
  fhir?: {
    resourceType: string;
    version: string;
  };

  /** Pipeline suggestion based on classification */
  suggestedPipelineId?: string;
}

export interface MappedPayload {
  /** FHIR resources produced by mapping */
  resources: unknown[];
  /** Mapping definition ID that was applied */
  mappingId: string;
  /** Mapping definition version */
  mappingVersion: string;
  /** Fields that could not be mapped */
  unmappedFields: string[];
}

export interface NormalizedPayload {
  /** FHIR R4 Bundle */
  bundle: unknown;
  /** Validation results */
  validation: {
    valid: boolean;
    errors: Array<{ path: string; message: string; severity: 'error' | 'warning' | 'info' }>;
  };
}

export interface RoutingDecision {
  /** Destination IDs to route to */
  destinationIds: string[];
  /** Trigger that caused this routing */
  trigger: {
    type: 'explicit' | 'cdc' | 'inferred';
    event: string;
    confidence?: number;
  };
}

export interface LineageEntry {
  /** Pipeline stage */
  stage: EnvelopeStage;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Transform/mapping ID applied */
  transformId: string;
  /** Transform version (semver or git SHA) */
  transformVersion: string;
  /** SHA-256 hash of stage input */
  inputHash: string;
  /** SHA-256 hash of stage output */
  outputHash: string;
  /** Processing duration in milliseconds */
  durationMs: number;
}

export interface ProcessingError {
  /** Pipeline stage where error occurred */
  stage: EnvelopeStage;
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Stack trace (only in non-production) */
  stack?: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Number of retry attempts so far */
  retryCount: number;
}

export interface Envelope {
  /** ULID — sortable, unique */
  id: string;
  /** Tenant this message belongs to */
  tenantId: string;
  /** Pipeline processing this message */
  pipelineId: string;
  /** Source connector that received this message */
  sourceId: string;
  /** OpenTelemetry trace ID for distributed tracing */
  traceId: string;

  /** Current processing stage */
  stage: EnvelopeStage;

  /** Raw message data */
  raw: RawPayload;

  /** Populated after parse stage */
  parsed?: ParsedPayload;
  /** Populated after classify stage */
  classification?: Classification;
  /** Populated after map stage */
  mapped?: MappedPayload;
  /** Populated after normalize stage */
  normalized?: NormalizedPayload;
  /** Populated after route stage */
  routing?: RoutingDecision;

  /** Full processing lineage — every stage records an entry */
  lineage: LineageEntry[];
  /** Errors encountered during processing */
  errors: ProcessingError[];

  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}
