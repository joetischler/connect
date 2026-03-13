import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  bigserial,
  inet,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── Tenants ────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  plan: varchar('plan', { length: 32 }).notNull().default('starter'),
  llmConfig: jsonb('llm_config'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email', { length: 320 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 32 }).notNull().default('viewer'),
  externalId: varchar('external_id', { length: 255 }),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email),
]);

// ─── API Keys ───────────────────────────────────────────────────────────────

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 128 }).notNull().unique(),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
});

// ─── FHIR Resources ────────────────────────────────────────────────────────

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  resourceType: varchar('resource_type', { length: 64 }).notNull(),
  fhirId: varchar('fhir_id', { length: 255 }).notNull(),
  versionId: integer('version_id').notNull().default(1),
  content: jsonb('content').notNull(),

  // Flattened searchable columns
  subjectRef: varchar('subject_ref', { length: 255 }),
  encounterRef: varchar('encounter_ref', { length: 255 }),
  status: varchar('status', { length: 64 }),
  effectiveAt: timestamp('effective_at', { withTimezone: true }),

  // Provenance
  sourceId: uuid('source_id'),
  envelopeId: varchar('envelope_id', { length: 26 }),
  qualityScore: jsonb('quality_score'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('resources_tenant_type_fhir_version_idx').on(
    table.tenantId, table.resourceType, table.fhirId, table.versionId,
  ),
  index('resources_type_subject_idx').on(table.tenantId, table.resourceType, table.subjectRef),
  index('resources_effective_idx').on(table.tenantId, table.effectiveAt),
]);

// ─── Pipelines ──────────────────────────────────────────────────────────────

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 32 }).notNull().default('1.0.0'),
  description: text('description'),
  /** Full pipeline YAML definition */
  definition: text('definition').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  enabled: boolean('enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
}, (table) => [
  index('pipelines_tenant_idx').on(table.tenantId),
]);

// ─── Mappings ───────────────────────────────────────────────────────────────

export const mappings = pgTable('mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 32 }).notNull().default('1.0.0'),
  description: text('description'),
  sourceFormat: varchar('source_format', { length: 32 }).notNull(),
  sourceMessageType: varchar('source_message_type', { length: 64 }),
  sourceVendorProfile: varchar('source_vendor_profile', { length: 128 }),
  /** Field mapping definitions as JSON */
  definition: jsonb('definition').notNull(),
  outputResourceTypes: jsonb('output_resource_types').notNull().default([]),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
}, (table) => [
  index('mappings_tenant_format_idx').on(table.tenantId, table.sourceFormat),
]);

// ─── Sources ────────────────────────────────────────────────────────────────

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 32 }).notNull(),
  config: jsonb('config').notNull(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('sources_tenant_idx').on(table.tenantId),
]);

// ─── Destinations ───────────────────────────────────────────────────────────

export const destinations = pgTable('destinations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 32 }).notNull(),
  config: jsonb('config').notNull(),
  retryConfig: jsonb('retry_config'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('destinations_tenant_idx').on(table.tenantId),
]);

// ─── Envelopes (Message Processing Records) ────────────────────────────────

export const envelopes = pgTable('envelopes', {
  id: varchar('id', { length: 26 }).primaryKey(), // ULID
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  sourceId: uuid('source_id').notNull(),
  traceId: varchar('trace_id', { length: 64 }).notNull(),
  stage: varchar('stage', { length: 32 }).notNull(),
  raw: jsonb('raw').notNull(),
  parsed: jsonb('parsed'),
  classification: jsonb('classification'),
  mapped: jsonb('mapped'),
  normalized: jsonb('normalized'),
  routing: jsonb('routing'),
  lineage: jsonb('lineage').notNull().default([]),
  errors: jsonb('errors').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('envelopes_tenant_pipeline_idx').on(table.tenantId, table.pipelineId),
  index('envelopes_tenant_stage_idx').on(table.tenantId, table.stage),
  index('envelopes_created_idx').on(table.tenantId, table.createdAt),
]);

// ─── Audit Log (Immutable, Append-Only) ────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  actor: jsonb('actor').notNull(),
  action: varchar('action', { length: 64 }).notNull(),
  resource: jsonb('resource').notNull(),
  detail: jsonb('detail'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
}, (table) => [
  index('audit_log_tenant_timestamp_idx').on(table.tenantId, table.timestamp),
  index('audit_log_tenant_action_idx').on(table.tenantId, table.action),
]);
