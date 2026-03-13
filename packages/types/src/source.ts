/**
 * Source and Destination connection types.
 */

import type { SourceType, DestinationType } from './pipeline.js';

export interface Source {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: SourceType;
  config: SourceConfig;
  /** Pipeline ID this source feeds into */
  pipelineId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SourceConfig =
  | MLLPSourceConfig
  | HTTPSourceConfig
  | SFTPSourceConfig
  | FHIRSubscriptionConfig
  | WebhookSourceConfig;

export interface MLLPSourceConfig {
  type: 'mllp';
  port: number;
  host?: string;
  tls?: boolean;
  tlsCert?: string;
  tlsKey?: string;
  /** Send ACK/NAK responses */
  ack?: boolean;
  /** Max concurrent connections */
  maxConnections?: number;
}

export interface HTTPSourceConfig {
  type: 'http';
  path: string;
  /** Expected content types */
  acceptContentTypes?: string[];
  /** Require API key for this endpoint */
  requireAuth?: boolean;
}

export interface SFTPSourceConfig {
  type: 'sftp';
  host: string;
  port?: number;
  username: string;
  /** Stored encrypted */
  password?: string;
  privateKey?: string;
  remotePath: string;
  /** File pattern to match (glob) */
  filePattern?: string;
  /** Poll interval in seconds */
  pollIntervalSeconds?: number;
  /** Move processed files to this path */
  archivePath?: string;
}

export interface FHIRSubscriptionConfig {
  type: 'fhir-subscription';
  serverUrl: string;
  /** FHIR Subscription resource criteria */
  criteria: string;
  authType?: 'none' | 'bearer' | 'oauth2';
  authConfig?: Record<string, string>;
}

export interface WebhookSourceConfig {
  type: 'webhook';
  path: string;
  /** Secret for HMAC signature validation */
  secret?: string;
}

export interface Destination {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: DestinationType;
  config: DestinationConfig;
  enabled: boolean;
  /** Retry configuration */
  retry?: RetryConfig;
  createdAt: string;
  updatedAt: string;
}

export type DestinationConfig =
  | InternalStoreConfig
  | FHIRRestConfig
  | WebhookDestConfig
  | SFTPDestConfig
  | DatabaseDestConfig;

export interface InternalStoreConfig {
  type: 'internal-store';
}

export interface FHIRRestConfig {
  type: 'fhir-rest';
  url: string;
  authType?: 'none' | 'bearer' | 'oauth2';
  authConfig?: Record<string, string>;
}

export interface WebhookDestConfig {
  type: 'webhook';
  url: string;
  headers?: Record<string, string>;
  /** Secret for signing payloads */
  secret?: string;
}

export interface SFTPDestConfig {
  type: 'sftp';
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
  /** File naming template */
  fileNameTemplate?: string;
}

export interface DatabaseDestConfig {
  type: 'database';
  connectionString: string;
  table: string;
  /** Column mapping from FHIR paths to DB columns */
  columnMappings: Record<string, string>;
}

export interface RetryConfig {
  maxRetries: number;
  /** Initial delay in ms */
  initialDelayMs: number;
  /** Maximum delay in ms */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}
