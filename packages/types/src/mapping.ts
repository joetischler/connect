/**
 * Mapping definitions: field-level mapping from source formats to FHIR R4.
 * Supports deterministic rules, AI suggestions, and human overrides.
 */

export interface FieldMapping {
  /** Source field path (e.g., "PID.5.1", "column_name", "Loop2300.CLM01") */
  sourceField: string;
  /** Target FHIR path (e.g., "Patient.name[0].family") */
  targetPath: string;
  /** Optional value transformation */
  transform?: FieldTransform;
  /** Whether this mapping was AI-suggested or manually defined */
  origin: 'deterministic' | 'ai-suggested' | 'manual';
  /** Confidence score for AI-suggested mappings (0.0 - 1.0) */
  confidence?: number;
  /** AI reasoning for the suggestion */
  reasoning?: string;
}

export type FieldTransformType =
  | 'direct'       // Copy value as-is
  | 'lookup'       // Map value through a lookup table
  | 'format'       // Apply formatting (date, phone, etc.)
  | 'concat'       // Concatenate multiple source fields
  | 'split'        // Split source field into multiple target fields
  | 'code-map'     // Map terminology codes (ICD-9→ICD-10, etc.)
  | 'template'     // Apply a string template
  | 'custom';      // Custom JavaScript transform function

export interface FieldTransform {
  type: FieldTransformType;
  config: Record<string, unknown>;
}

export interface MappingSuggestion {
  sourceField: string;
  targetPath: string;
  confidence: number;
  reasoning: string;
  /** Alternative target paths ranked by confidence */
  alternatives: Array<{
    targetPath: string;
    confidence: number;
  }>;
  /** Sample values from source that informed the suggestion */
  sampleValues?: string[];
}

export type MappingSessionStatus = 'draft' | 'review' | 'approved' | 'active';

export interface MappingSession {
  id: string;
  tenantId: string;
  /** Human-readable name */
  name: string;
  /** Source format description */
  sourceFormat: string;
  /** Target FHIR resource types */
  targetResourceTypes: string[];
  status: MappingSessionStatus;

  /** Sample source messages for preview */
  sourceSamples: unknown[];
  /** AI-generated suggestions */
  suggestions: MappingSuggestion[];
  /** Human-approved mappings (overrides suggestions) */
  approvedMappings: FieldMapping[];

  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MappingDefinition {
  id: string;
  tenantId: string;
  name: string;
  version: string;
  description?: string;

  /** Source format this mapping applies to */
  sourceFormat: 'hl7v2' | 'x12' | 'cda' | 'csv' | 'json' | 'xml';
  /** Optional: specific message type (e.g., "ADT^A01") */
  sourceMessageType?: string;
  /** Optional: vendor profile (e.g., "Epic 2024") */
  sourceVendorProfile?: string;

  /** Field-level mappings */
  mappings: FieldMapping[];

  /** FHIR resource types this definition produces */
  outputResourceTypes: string[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
