# Connect — Project Overview

Comprehensive onboarding document for new team members. Read this top to bottom before diving into code.

> **Important: Strategic Pivot (March 2025)**
>
> This repo started as "Connect" — a healthcare integration engine to replace Mirth Connect. The integration layer (HL7v2 parsing, NATS queue, pipeline engine) is still here and working, but the product vision has expanded significantly. **The real product is a healthcare agent scoping platform** — see [Strategic Direction](#0-strategic-direction) below. The integration layer is now Layer 1 (data ingestion), not the product itself.

---

## Table of Contents

0. [Strategic Direction](#0-strategic-direction)
1. [What Is Connect?](#1-what-is-connect)
2. [Why Does This Exist?](#2-why-does-this-exist)
3. [Architecture](#3-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Monorepo Structure](#5-monorepo-structure)
6. [Package Dependency Graph](#6-package-dependency-graph)
7. [Database Schema](#7-database-schema)
8. [The Envelope Pattern](#8-the-envelope-pattern)
9. [Processing Pipeline](#9-processing-pipeline)
10. [Intelligence Layer](#10-intelligence-layer)
11. [API Routes](#11-api-routes)
12. [Web UI](#12-web-ui)
13. [Key Type Definitions](#13-key-type-definitions)
14. [Current Implementation Status](#14-current-implementation-status)
15. [Roadmap & What's Next](#15-roadmap--whats-next)
16. [Feature Roadmap by Version](#16-feature-roadmap-by-version)
17. [Getting Started](#17-getting-started)
18. [Testing](#18-testing)
19. [Environment Variables](#19-environment-variables)
20. [Key Design Decisions](#20-key-design-decisions)

---

## 0. Strategic Direction

### The Bigger Picture

Connect's integration engine is a means to an end. The end is a **hierarchical scoping and agent deployment platform for healthcare**.

The core insight: Healthcare organizations have a well-defined organizational hierarchy (enterprise, practice, location, department, provider), and **HL7v2 ADT/SIU feeds contain this hierarchy in real-time motion**. By ingesting these feeds, we automatically erect the organizational scaffolding that makes it safe to deploy agents (LLM assistants, RPA bots, rule engines, any automated process) with properly scoped data access.

**Without proper scoping, agent deployment doesn't happen.** A scheduling bot at Practice A must not see Practice B's patients. A prior-auth agent at Location X needs that location's data, not the whole enterprise.

### Product Layers (Top Down)

```
Layer 5: AGENT MARKETPLACE & SUGGESTIONS (v0.3+)
Layer 4: AGENT RUNTIME — deploy, configure, monitor agents within scopes
Layer 3: SCOPED ACCESS CONTROL — actors (users + agents) assigned to org nodes
Layer 2: ORGANIZATIONAL HIERARCHY — FHIR-modeled, auto-populated from HL7v2
Layer 1: DATA INGESTION — HL7v2 parsing (this repo's current strength)
```

Layer 1 is a commodity (we have a working parser, or Mirth can feed us). The differentiation is Layers 2-4.

### What ADT/SIU Feeds Give Us

A single ADT + SIU feed from an EMR contains:
- **Organizations**: Facilities, departments (MSH.4, PV1.3 units, PV1.10 service)
- **Locations**: Buildings, wings, rooms, beds (PV1.3 location hierarchy)
- **Providers**: Attending, referring, admitting doctors + schedules (PV1.7/8/17, AIP)
- **Patient flow**: Admits, transfers, discharges, appointments, no-shows

Over time, this builds a complete, live picture of the organization. This is the CONTEXT that agents need.

### Hierarchy Model (FHIR R4-Aligned)

We mirror FHIR R4 organizational resources — NOT a de novo interpretation:
- **Organization** (with `partOf`) — enterprise, practice, department, team
- **Location** (with `partOf`, `managingOrganization`) — building, wing, ward, room, bed
- **Practitioner** — the person (name, NPI, qualifications)
- **PractitionerRole** — links practitioner to organization + location + specialty + schedule
- **HealthcareService** — services at organizations/locations

### Actor Model

Users and agents are unified as **actors**:
- An actor is either a human user or an automated process (any kind)
- Actors are assigned **scopes** — an org node and everything below it in the hierarchy
- Same agent template can be deployed at different scopes with different configs
- All data queries are filtered by the actor's scope

### What's Next

Phase 1 (next): Hierarchy tables + ADT/SIU extraction + scope-filtered queries
Phase 2: Actor/scope model + auth integration + agent templates
Phase 3: Agent runtime + deployment + monitoring
Phase 4: Pattern detection + agent suggestions

See the full architectural plan in the project planning docs.

---

## 1. What Is Connect?

Connect is a **cloud-first SaaS platform for healthcare data integration**. It replaces legacy integration engines (Mirth Connect, Rhapsody, Cloverleaf) with a modern, intelligent system that:

- **Ingests** healthcare data from any source — HL7v2 over MLLP, X12/EDI over SFTP, FHIR REST, CDA/CCDA XML, CSV flat files, webhooks
- **Auto-detects** the format and message type using a 3-tier classification system (deterministic rules → fingerprint matching → LLM fallback)
- **Auto-maps** source fields to FHIR R4 paths using AI suggestions that humans confirm — the "OneSchema for healthcare" model
- **Normalizes** everything to a canonical FHIR R4 data model stored in PostgreSQL
- **Routes** processed data to configurable destinations based on explicit triggers (HL7v2 trigger events), CDC events, and (eventually) AI-inferred clinical patterns
- **Tracks** full data lineage — every transformation, every version, every hash — for HIPAA auditability

This is a **proprietary commercial product**. TypeScript/Node.js full stack. **Multi-tenant from day one**.

---

## 2. Why Does This Exist?

### The Problem

Healthcare integration is stuck in 2004:

- **Mirth Connect** — the de facto standard — is a Java Swing desktop app with an ES5 (Rhino) scripting engine. No cloud-native design, no AI, no modern developer experience. As of v4.6, it is **no longer open source**.
- **95%+ of US healthcare organizations** still exchange data via HL7v2 messages, each customized per vendor (Z-segments, non-standard fields, unreliable version headers). Every integration is a bespoke, manual mapping exercise.
- **X12/EDI claims processing** involves 7,000+ payer companion guides, each with subtle variations.
- **Flat file reports over SFTP** remain ubiquitous for lab results, registries, and quality reporting.
- **FHIR adoption** is growing but inconsistent — implementations vary wildly between vendors.

Every new integration today requires a senior engineer to manually inspect messages, write field-by-field mappings, and test against vendor-specific edge cases. This takes weeks per integration.

### The Solution

Connect makes integrations **fast to set up and easy to maintain** by:

1. **AI suggests, humans confirm** — The intelligence layer proposes format detection and field mappings with confidence scores. Engineers review and approve rather than build from scratch. The system works fully without AI; LLMs are never in the critical path.
2. **Pipeline-as-code (YAML)** — Pipeline definitions are version-controllable, diffable, and reviewable. No more "channels stored in a database" that can't be code-reviewed.
3. **FHIR R4 as the canonical model** — All formats normalize to FHIR R4, creating a unified data layer regardless of source format.
4. **Cloud-native architecture** — Separate API server and worker fleet communicating via NATS JetStream. Horizontally scalable. No single-threaded bottleneck.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Web UI (React)                        │
│  Pipeline Builder │ Mapping Editor │ Message Inspector │ Dash │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────▼───────────────────────────────────┐
│                    API Server (Fastify)                       │
│  Pipeline CRUD │ Auth/RBAC │ Tenant Mgmt │ Orchestration     │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
     PostgreSQL                         NATS JetStream
     + S3 (raw msgs)                         │
                          ┌──────────────┬────┴─────────┐
                    ┌─────▼────┐  ┌──────▼─────┐  ┌────▼──────┐
                    │  Parse   │  │  Map/       │  │  Route/   │
                    │  Workers │  │  Transform  │  │  Deliver  │
                    │          │  │  Workers    │  │  Workers  │
                    └──────────┘  └────────────┘  └───────────┘
```

**Three runtime processes:**

| Process | Location | Purpose |
|---------|----------|---------|
| **API Server** | `apps/server/` | Fastify HTTP server. CRUD for all resources. Tenant management. Will host WebSocket for real-time UI updates. |
| **Worker** | `apps/worker/` | Subscribes to NATS JetStream stage subjects. Executes pipeline stages (parse, classify, map, normalize, route, deliver). Horizontally scalable. |
| **Web App** | `apps/web/` | React SPA served by Vite in dev, static build in prod. Talks to API server via REST. |

**Three data stores:**

| Store | Purpose |
|-------|---------|
| **PostgreSQL 16** | All structured data: tenants, users, pipelines, mappings, sources, destinations, envelopes, FHIR resources, audit log. Drizzle ORM. |
| **NATS JetStream** | Message queue between pipeline stages. Durable consumers, replay support, guaranteed delivery. 7-day retention. |
| **S3 / Minio** | Raw message storage. Original bytes preserved for replay/reprocessing. Minio for local dev. |

---

## 4. Tech Stack

| Concern | Choice | Why |
|---------|--------|-----|
| **Language** | TypeScript 5.x, ESM, Node.js 22+ | Full-stack type safety, large ecosystem for healthcare libraries |
| **Monorepo** | Turborepo + pnpm | Fast builds with caching, clean dependency management |
| **API Server** | Fastify 5 | Fastest Node.js HTTP framework, excellent plugin system |
| **Database** | PostgreSQL 16 + Drizzle ORM | JSONB for FHIR resources, strong typing with Drizzle, battle-tested |
| **Message Queue** | NATS JetStream | Sub-3ms latency, simpler ops than Kafka, replay support, great Node.js client |
| **Object Storage** | S3-compatible (Minio for dev) | Raw message preservation for replay |
| **Web Framework** | React 19 + Vite 6 | Modern React with fast dev server |
| **Routing** | TanStack Router | Type-safe routing |
| **Data Fetching** | TanStack React Query | Server state management with caching |
| **Styling** | Tailwind CSS 3.4 | Utility-first, consistent design |
| **UI Components** | Radix UI (planned) | Accessible, unstyled primitives |
| **HL7v2 Parser** | `hl7v2` (Panates) | Native Node.js HL7v2 parsing |
| **X12 Parser** | `x12-parser` | EDI transaction parsing |
| **XML Parser** | `fast-xml-parser` | CDA/CCDA document parsing |
| **CSV Parser** | `csv-parse` | Streaming flat file parsing |
| **Auth** | Arctic (OAuth2/OIDC) | Lightweight OAuth2 provider support |
| **Logging** | Pino | Structured JSON logging with context |
| **Metrics** | prom-client (Prometheus) | Standard metrics format |
| **Tracing** | OpenTelemetry | Distributed tracing across services |
| **Testing** | Vitest | Fast, ESM-native test runner |
| **E2E Testing** | Playwright (planned) | Browser automation for UI tests |
| **Containers** | Docker Compose (dev), Kubernetes/Helm (prod, planned) | Standard container orchestration |

---

## 5. Monorepo Structure

```
connect/
├── apps/
│   ├── server/                # Fastify API server (port 3000)
│   │   └── src/
│   │       ├── index.ts       # Server bootstrap, plugin registration
│   │       └── routes/        # Route handlers
│   │           ├── health.ts          # GET /health, GET /ready
│   │           ├── tenants.ts         # CRUD /api/v1/tenants
│   │           ├── pipelines.ts       # CRUD /api/v1/pipelines
│   │           ├── sources.ts         # CRUD /api/v1/sources
│   │           ├── destinations.ts    # CRUD /api/v1/destinations
│   │           └── envelopes.ts       # GET /api/v1/envelopes
│   │
│   ├── worker/                # Pipeline stage worker
│   │   └── src/
│   │       └── index.ts       # Stage handler registration, NATS subscriptions
│   │
│   └── web/                   # React SPA (Vite, port 5173)
│       └── src/
│           ├── main.tsx       # App entry point
│           ├── App.tsx        # Router + layout + pages
│           └── ...
│
├── packages/
│   ├── types/                 # Shared TypeScript types (zero deps)
│   │   └── src/
│   │       ├── envelope.ts    # Envelope, RawPayload, ParsedPayload, Classification, etc.
│   │       ├── pipeline.ts    # PipelineDefinition, StageType, FilterRule, TriggerRule
│   │       ├── mapping.ts     # MappingDefinition, FieldMapping, MappingSuggestion
│   │       ├── tenant.ts      # Tenant, User, UserRole, ApiKey, AuditLogEntry
│   │       ├── source.ts      # Source/Destination configs (MLLP, HTTP, SFTP, etc.)
│   │       └── quality.ts     # QualityScore, QualityIssue
│   │
│   ├── db/                    # Database layer (Drizzle ORM + PostgreSQL)
│   │   └── src/
│   │       ├── schema.ts      # All table definitions (10 tables)
│   │       ├── client.ts      # Database client factory
│   │       └── seed.ts        # Development seed data
│   │
│   ├── queue/                 # NATS JetStream abstraction
│   │   └── src/
│   │       ├── connection.ts  # Singleton NATS connection management
│   │       ├── publisher.ts   # Publish envelopes to stage subjects
│   │       └── subscriber.ts  # Subscribe to stages with durable consumers
│   │
│   ├── observability/         # Logging + Metrics + Tracing
│   │   └── src/
│   │       ├── logger.ts      # Pino structured logger with tenant/pipeline context
│   │       ├── metrics.ts     # Prometheus counters, histograms, gauges
│   │       └── tracing.ts     # OpenTelemetry SDK setup
│   │
│   ├── auth/                  # Authentication & authorization [STUB]
│   ├── hl7v2/                 # HL7v2 message parser [IMPLEMENTED]
│   ├── x12/                   # X12/EDI parser [STUB]
│   ├── fhir/                  # FHIR R4 helpers [STUB]
│   ├── cda/                   # CDA/CCDA XML parser [STUB]
│   ├── flatfile/              # CSV/TSV parser [STUB]
│   ├── pipeline/              # Pipeline engine [IMPLEMENTED]
│   ├── mapping/               # Field mapping engine [STUB]
│   ├── intelligence/          # AI layer [STUB]
│   ├── connectors/            # Source/destination adapters [STUB]
│   └── ui/                    # Shared React components
│
├── definitions/               # Static data definitions (all empty, planned)
│   ├── hl7v2/                 # HL7v2 message structure definitions + vendor profiles
│   ├── x12/                   # X12 transaction set schemas
│   ├── fhir/                  # FHIR R4 StructureDefinitions
│   └── terminologies/         # SNOMED, LOINC, ICD-10 code subsets
│
├── docker/
│   └── docker-compose.yml     # PostgreSQL 16, NATS 2.10, Minio
│
├── package.json               # Root: scripts, engines (Node 22+), pnpm 10.29.3
├── pnpm-workspace.yaml        # Workspace: apps/*, packages/*
├── turbo.json                 # Build pipeline: build, dev, lint, test, typecheck, clean
├── tsconfig.base.json         # Shared TS config: ES2023, NodeNext, strict
└── .env.example               # Environment variable template
```

---

## 6. Package Dependency Graph

```
@connect/types  ← (zero external dependencies, everything depends on this)
    │
    ├── @connect/db          (types + drizzle-orm + postgres)
    ├── @connect/queue       (types + nats)
    ├── @connect/auth        (types + arctic)
    ├── @connect/hl7v2       (types + hl7v2)
    ├── @connect/x12         (types + x12-parser)
    ├── @connect/fhir        (types)
    ├── @connect/cda         (types + fast-xml-parser)
    ├── @connect/flatfile    (types + csv-parse)
    └── @connect/connectors  (types)

@connect/observability       ← (standalone: pino + prom-client + opentelemetry)

@connect/fhir
    └── @connect/mapping     (fhir)
        └── @connect/intelligence  (mapping)

@connect/queue
    └── @connect/pipeline    (queue + yaml)

Apps:
  @connect/server  → db, observability, queue, types
  @connect/worker  → types, db, queue, observability, hl7v2, pipeline
  @connect/web     → react, react-query, tanstack-router, tailwindcss
```

---

## 7. Database Schema

Defined in `packages/db/src/schema.ts` using Drizzle ORM. All tables are tenant-scoped.

| Table | Primary Key | Description |
|-------|-------------|-------------|
| **tenants** | `uuid` | Organizations. Fields: name, slug (unique), plan (`starter`/`professional`/`enterprise`), llmConfig (JSONB), active flag. |
| **users** | `uuid` | User accounts scoped to a tenant. Fields: email, name, role (`owner`/`admin`/`editor`/`viewer`), externalId (for SSO), lastLoginAt. Unique index on (tenantId, email). |
| **api_keys** | `uuid` | API keys for programmatic access. Fields: name, keyHash (unique, for lookup), scopes (JSONB array), expiresAt, lastUsedAt, createdBy. |
| **resources** | `uuid` | Normalized FHIR R4 resources stored as JSONB. Fields: resourceType, fhirId, versionId, content (the full FHIR resource), subjectRef, encounterRef, status, effectiveAt (flattened for querying), sourceId, envelopeId (provenance), qualityScore (JSONB). Unique index on (tenantId, resourceType, fhirId, versionId). |
| **pipelines** | `uuid` | Pipeline definitions. Fields: name, version, description, definition (YAML stored as text), status (`draft`/`active`/`paused`/`error`/`archived`), enabled flag, createdBy. |
| **mappings** | `uuid` | Field mapping definitions. Fields: name, version, sourceFormat, sourceMessageType, sourceVendorProfile, definition (JSONB — array of FieldMapping objects), outputResourceTypes (JSONB), status. |
| **sources** | `uuid` | Inbound data source configurations. Fields: name, type (`mllp`/`http`/`sftp`/`fhir-subscription`/`webhook`/`database`/`queue`), config (JSONB — type-specific), pipelineId (FK), enabled. |
| **destinations** | `uuid` | Outbound data destination configurations. Fields: name, type (`internal-store`/`fhir-rest`/`webhook`/`sftp`/`database`/`queue`/`mllp`), config (JSONB), retryConfig (JSONB — maxRetries, delays, backoff). |
| **envelopes** | `varchar(26)` ULID | Message processing records. Fields: tenantId, pipelineId, sourceId, traceId, stage, raw/parsed/classification/mapped/normalized/routing (all JSONB, populated as stages complete), lineage (JSONB array), errors (JSONB array). Indexed on (tenantId, pipelineId), (tenantId, stage), (tenantId, createdAt). |
| **audit_log** | `bigserial` | Immutable, append-only audit trail (HIPAA requirement). Fields: tenantId, timestamp, actor (JSONB: type/id/name), action (`create`/`read`/`update`/`delete`/`export`/`approve`/`deploy`/`login`/`logout`), resource (JSONB: type/id), detail (JSONB), ipAddress (inet), userAgent. |

---

## 8. The Envelope Pattern

Every message flowing through the system is wrapped in an **Envelope** — the central data structure defined in `packages/types/src/envelope.ts`.

```
Envelope {
  id:             ULID (universally unique, time-ordered)
  tenantId:       UUID
  pipelineId:     UUID
  sourceId:       UUID
  traceId:        string (for distributed tracing)

  stage:          'ingested' | 'parsed' | 'classified' | 'filtered' |
                  'mapped' | 'normalized' | 'routed' | 'delivered' | 'failed'

  raw:            { contentRef (S3 key), contentType (MIME), receivedAt, sourceMetadata }
  parsed?:        { format, content (structured), parserVersion }
  classification?:{ format, confidence (0-1), tier, messageType, triggerEvent, ... }
  mapped?:        { resources[], mappingId, mappingVersion, unmappedFields[] }
  normalized?:    { bundle (FHIR R4), validation { valid, errors[] } }
  routing?:       { destinationIds[], trigger { type, event, confidence } }

  lineage:        [ { stage, timestamp, transformId, inputHash, outputHash, durationMs } ]
  errors:         [ { stage, code, message, stack, timestamp, retryable, retryCount } ]

  createdAt:      ISO 8601
  updatedAt:      ISO 8601
}
```

**Why this matters:**
- Each stage populates its corresponding field (parsed, classification, mapped, etc.)
- The lineage array provides a complete audit trail with SHA-256 hashes of input/output at each stage
- Errors are accumulated, not thrown — the envelope carries its full processing history
- The raw payload is always preserved in S3 for replay

---

## 9. Processing Pipeline

Messages flow through a fixed sequence of stages, each implemented as a NATS JetStream subject:

```
Ingest → Parse → Classify → Filter → Map/Transform → Normalize → Route → Deliver
```

### Stage Details

| Stage | NATS Subject | What Happens |
|-------|-------------|--------------|
| **ingested** | `connect.{tenant}.pipeline.{id}.ingested` | Raw bytes received from a source (MLLP, HTTP, SFTP, etc.). Stored in S3. Envelope created with `raw` payload. |
| **parsed** | `connect.{tenant}.pipeline.{id}.parsed` | Format-specific parser invoked (HL7v2, X12, CDA, CSV, FHIR). Raw bytes → structured object. `parsed` field populated. |
| **classified** | `connect.{tenant}.pipeline.{id}.classified` | Message type identified (e.g., ADT^A01, 837P, Patient resource). `classification` field populated with format, confidence, tier. |
| **filtered** | `connect.{tenant}.pipeline.{id}.filtered` | Pipeline filter rules evaluated. Messages that don't match are dropped (not published to next stage). |
| **mapped** | `connect.{tenant}.pipeline.{id}.mapped` | Mapping engine transforms source fields to FHIR paths using the MappingDefinition. `mapped` field populated with FHIR resources. |
| **normalized** | `connect.{tenant}.pipeline.{id}.normalized` | FHIR R4 Bundle assembled. Validation run. `normalized` field populated. |
| **routed** | `connect.{tenant}.pipeline.{id}.routed` | Trigger rules evaluated. Destination IDs determined. `routing` field populated. |
| **delivered** | `connect.{tenant}.pipeline.{id}.delivered` | Data sent to each destination (FHIR REST, webhook, database, SFTP, etc.). Terminal success state. |
| **failed** | `connect.{tenant}.pipeline.{id}.failed` | Terminal error state. Envelope preserved with error details for investigation/retry. |

### NATS Configuration

- **Stream name**: `CONNECT`
- **Subject pattern**: `connect.>`
- **Retention**: 7 days, file-based storage
- **Consumer pattern**: One durable consumer per stage, named `worker-{stage}`
- **Concurrency**: Up to 10 messages processed in parallel per stage
- **ACK timeout**: 30 seconds
- **Error handling**: Explicit NAK on processing error, envelope published to `failed` stage

### Pipeline Definitions (YAML)

Pipelines are defined in YAML and stored in the `pipelines` table. Example structure:

```yaml
id: pipeline-123
name: "Epic ADT Feed"
version: "1.0.0"
source:
  type: mllp
  config:
    port: 2575
    tls: true
stages:
  - id: parse
    type: auto-parse
  - id: classify
    type: auto-classify
  - id: filter-admits
    type: filter
    when:
      - field: classification.messageType
        operator: eq
        value: ADT
  - id: map-to-fhir
    type: hl7v2-to-fhir
    config:
      mappingId: mapping-456
    continueOnError: true
    timeoutMs: 5000
destinations:
  - id: dest-1
    type: fhir-rest
    config:
      url: https://fhir.example.com/r4
```

The pipeline engine (`packages/pipeline/`) supports:
- **Filter evaluation**: 9 operators (`eq`, `neq`, `in`, `not_in`, `contains`, `regex`, `exists`, `gt`, `lt`)
- **Conditional stage execution**: `when` clauses on any stage
- **Timeouts**: Per-stage timeout with `timeoutMs`
- **Error tolerance**: `continueOnError` flag per stage
- **Lineage tracking**: Automatic lineage entry creation per stage

---

## 10. Intelligence Layer

The intelligence layer is the key differentiator. It provides AI-assisted automation while keeping humans in control.

### Auto-Detection (3 Tiers)

| Tier | Method | Coverage | Cost |
|------|--------|----------|------|
| **1. Deterministic** | Pattern matching: `MSH\|` = HL7v2, `ISA` = X12, `"resourceType"` = FHIR, `<ClinicalDocument>` = CDA | ~90%+ of messages | Zero |
| **2. Fingerprint** | Hash segment ordering, Z-segment names, field patterns against vendor profile library (Epic, Cerner, Meditech, etc.) | ~8% of messages | Zero |
| **3. LLM** | Structured prompt with first N bytes (PHI-scrubbed). Cached by pattern hash so repeated formats only call LLM once. | ~2% (unknowns) | Per-call |

### Auto-Mapping (4 Tiers)

| Tier | Method | Example |
|------|--------|---------|
| **1. Known mappings** | Standard HL7v2→FHIR tables from `definitions/` | `PID.5.1` → `Patient.name[0].family` (always) |
| **2. Semantic matching** | Embeddings of field names + sample values vs FHIR path descriptions. Local model via `@xenova/transformers` — no API calls. | Column "PatientLastName" → `Patient.name[0].family` |
| **3. LLM-assisted** | For low-confidence matches: structured prompt with field name, sample values (PHI-scrubbed), candidate FHIR paths. Returns ranked suggestions with reasoning. | Z-segment `ZPD.3` with values like "ACME INSURANCE" → `Coverage.payor` |
| **4. Learning** | Approved mappings feed back into the deterministic layer for that tenant. Over time, anonymized cross-tenant learning. | After approving `ZPD.3` → `Coverage.payor`, future messages auto-map. |

### Schema Inference (Flat Files)

For CSV/TSV files with no schema:
1. **Column type detection** — Regex for MRNs, NPIs, ICD-10 codes, dates, phone numbers
2. **Column name semantic analysis** — Match column headers to FHIR paths using embeddings
3. **Human confirmation** — Suggestions shown in mapping editor UI with confidence scores

### PHI Safety

- LLM calls **always** PHI-scrub first: names → `[NAME_1]`, MRNs → `[MRN_1]`, etc.
- LLM provider is configurable per tenant: OpenAI, Anthropic, or **local Ollama for zero data egress**
- System works fully without any LLM configured (`LLM_PROVIDER=none`)

### Format-to-FHIR Mapping Strategy

| Source Format | Strategy |
|---------------|----------|
| **HL7v2** | PID→Patient, PV1→Encounter, OBR/OBX→DiagnosticReport/Observation. MSH-9 trigger event determines create/update/delete semantics. Z-segments preserved as FHIR extensions. |
| **X12/EDI** | 837→Claim, 835→ClaimResponse, 270→CoverageEligibilityRequest. Loop hierarchy maps to resource reference graph. |
| **FHIR** | Pass-through with validation + optional version normalization (STU3→R4). |
| **CDA/CCDA** | Section-to-FHIR using HL7-published CDA→FHIR Implementation Guides. |
| **CSV/Flat files** | AI-powered schema inference: column names matched to FHIR paths, user confirms via mapping editor. |

---

## 11. API Routes

All routes are defined in `apps/server/src/routes/`. The API server runs on port 3000.

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{ status: 'ok', timestamp }` |
| `GET` | `/ready` | Returns `{ status: 'ready', timestamp }` (TODO: check DB/NATS) |

### Tenants

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tenants` | List all tenants |
| `GET` | `/api/v1/tenants/:id` | Get single tenant |
| `POST` | `/api/v1/tenants` | Create tenant + owner user |
| `PUT` | `/api/v1/tenants/:id` | Update tenant (name, plan, llmConfig, active) |

### Pipelines (requires `x-tenant-id` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/pipelines` | List tenant's pipelines |
| `GET` | `/api/v1/pipelines/:id` | Get single pipeline |
| `POST` | `/api/v1/pipelines` | Create pipeline (name, description, definition YAML) |
| `PUT` | `/api/v1/pipelines/:id` | Update pipeline (name, description, definition, enabled, status) |
| `DELETE` | `/api/v1/pipelines/:id` | Delete pipeline |

### Sources (requires `x-tenant-id` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sources` | List tenant's sources |
| `POST` | `/api/v1/sources` | Create source |
| `PUT` | `/api/v1/sources/:id` | Update source |
| `DELETE` | `/api/v1/sources/:id` | Delete source |

### Destinations (requires `x-tenant-id` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/destinations` | List tenant's destinations |
| `POST` | `/api/v1/destinations` | Create destination |
| `PUT` | `/api/v1/destinations/:id` | Update destination |
| `DELETE` | `/api/v1/destinations/:id` | Delete destination |

### Envelopes (requires `x-tenant-id` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/envelopes` | List envelopes (filters: pipelineId, stage, limit) |
| `GET` | `/api/v1/envelopes/:id` | Get single envelope with full processing history |

### Auth Model

Currently, tenant isolation uses a simple `x-tenant-id` HTTP header. Proper auth middleware (OAuth2/OIDC via Arctic, API key validation, RBAC enforcement) is planned but not yet implemented.

---

## 12. Web UI

Built with React 19 + Vite + TanStack Router + TanStack Query + Tailwind CSS.

**Planned screens (8 total):**

| Screen | Description | Status |
|--------|-------------|--------|
| **Dashboard** | Message throughput, error rates, processing latency, queue depths, data quality trends | Skeleton with placeholder cards |
| **Sources** | Configure inbound connections (MLLP, FHIR subscriptions, SFTP, webhooks) | Stub ("coming soon") |
| **Pipelines** | Visual pipeline builder (DAG editor) + YAML code view | Stub |
| **Mapping Editor** | Side-by-side source↔FHIR mapping with AI suggestions, confidence scores, accept/reject | Stub |
| **Message Inspector** | Browse processed envelopes, view raw→parsed→normalized at each stage, full lineage | Stub |
| **Destinations** | Configure outbound connections (FHIR REST, webhooks, databases, queues) | Stub |
| **Data Explorer** | Browse normalized FHIR data lake, search, filter, export | Stub |
| **Settings** | Tenant config, user/role management, API keys, LLM provider, alert rules | Stub |

Dev server runs on port 5173 with a proxy to the API server (`/api` → `http://localhost:3000`).

---

## 13. Key Type Definitions

All types live in `packages/types/src/`. These are the core abstractions:

### Envelope Types (`envelope.ts`)
- `EnvelopeStage` — The 9 processing stages
- `RawPayload` — S3 content reference + MIME type
- `ParsedPayload` — Format identifier + structured content
- `Classification` — Format, confidence, tier, message-type-specific fields (HL7v2 messageType/triggerEvent, X12 transactionSet, FHIR resourceType)
- `MappedPayload` — Array of FHIR resources + mapping metadata
- `NormalizedPayload` — FHIR R4 Bundle + validation results
- `RoutingDecision` — Destination IDs + trigger information
- `LineageEntry` — Stage audit trail with SHA-256 hashes
- `ProcessingError` — Error details with retryable flag

### Pipeline Types (`pipeline.ts`)
- `StageType` — 17 built-in stage types (parsers, classifiers, mappers, quality, etc.)
- `SourceType` — 7 source types (mllp, http, sftp, fhir-subscription, webhook, database, queue)
- `DestinationType` — 7 destination types (internal-store, fhir-rest, webhook, sftp, database, queue, mllp)
- `FilterRule` — Field-level filtering with 9 operators
- `TriggerRule` — Event-driven actions (route, notify, webhook, transform)
- `PipelineDefinition` — Complete pipeline spec (source, stages, destinations, triggers)
- `PipelineState` — Runtime state (messagesProcessed24h, errorRate, avgLatencyMs)

### Mapping Types (`mapping.ts`)
- `FieldMapping` — Source field → FHIR target path + transform + origin (deterministic/ai-suggested/manual) + confidence
- `FieldTransformType` — 8 transform types (direct, lookup, format, concat, split, code-map, template, custom)
- `MappingSuggestion` — AI-generated mapping suggestion with confidence, reasoning, alternatives
- `MappingSession` — Interactive mapping workflow (draft → review → approved → active)
- `MappingDefinition` — Complete mapping spec with source format, vendor profile, field mappings

### Source/Destination Types (`source.ts`)
- Type-specific config interfaces: `MLLPSourceConfig`, `HTTPSourceConfig`, `SFTPSourceConfig`, `FHIRSubscriptionConfig`, `WebhookSourceConfig`
- Destination configs: `FHIRRestConfig`, `WebhookDestConfig`, `SFTPDestConfig`, `DatabaseDestConfig`, `InternalStoreConfig`
- `RetryConfig` — maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier

### Tenant Types (`tenant.ts`)
- `Tenant` — Organization with plan tier and optional LLM config
- `LLMConfig` — Provider (openai/anthropic/ollama/none), apiKey, baseUrl, model
- `UserRole` — owner, admin, editor, viewer
- `ApiKeyScope` — 11 granular scopes (pipelines:read, messages:write, admin, etc.)
- `AuditLogEntry` — Immutable audit record with actor, action, resource, detail

### Quality Types (`quality.ts`)
- `QualityScore` — Overall 0-100 score with 5 dimensions (completeness, conformance, consistency, timeliness, uniqueness)
- `QualityIssue` — Field-level quality issue with severity (critical/major/minor/info), dimension, message, suggestion

---

## 14. Current Implementation Status

### IMPLEMENTED (real working code + tests)

| Component | Package/Location | What's There |
|-----------|-----------------|--------------|
| **Monorepo scaffold** | Root | pnpm workspaces, Turborepo, tsconfig.base.json, Docker Compose |
| **Core types** | `packages/types/` | All type definitions across 6 files — Envelope, Pipeline, Mapping, Tenant, Source/Dest, Quality |
| **Database schema** | `packages/db/` | 10 Drizzle table definitions, client factory, migration support, seed script |
| **Message queue** | `packages/queue/` | NATS JetStream publisher, subscriber with durable consumers, subject builder. Tested. |
| **Observability** | `packages/observability/` | Pino structured logger with context, 6 Prometheus metrics (counters, histograms, gauges), OpenTelemetry tracing setup. Tested. |
| **HL7v2 parser** | `packages/hl7v2/` | `parseHL7v2()` — full message parsing with segment extraction + deterministic classification. `isHL7v2()` — format detection. `createAck()`/`createNak()` — ACK/NAK response generation. 11 tests. |
| **Pipeline engine** | `packages/pipeline/` | `parsePipelineYAML()` — YAML definition parsing with validation. `StageRegistry` — pluggable stage processor registration. `executePipeline()` — sequential execution with conditional skipping, timeouts, `continueOnError`, lineage tracking. `evaluateFilter()` — all 9 filter operators. `resolveField()` — dot-notation path resolution. 28 tests. |
| **API server** | `apps/server/` | Fastify 5 with CORS, WebSocket plugin, 6 route files implementing full CRUD for tenants, pipelines, sources, destinations, and read-only envelopes. Health checks. |
| **Worker** | `apps/worker/` | Stage handler infrastructure with NATS subscriptions. HL7v2 ingestion stage fully wired: auto-detects format via `isHL7v2()`, parses with `parseHL7v2()`, populates both `parsed` and `classification` fields. Error handling with retryable errors. Graceful shutdown. |
| **Web app** | `apps/web/` | React 19 + Vite + TanStack Router. Dashboard skeleton with navigation sidebar (8 menu items). Dashboard shows placeholder metric cards. |
| **Tests** | Various | **52 tests passing** across queue (3), observability (10), hl7v2 (11), pipeline (28) |

### STUBS (exports `VERSION` constant only, TODO comments)

| Package | What's Planned |
|---------|---------------|
| `@connect/x12` | X12/EDI parsing with `x12-parser` library |
| `@connect/fhir` | FHIR R4 resource builders, Bundle utility, REST client, validator |
| `@connect/cda` | CDA/CCDA XML parsing with `fast-xml-parser` |
| `@connect/flatfile` | CSV/TSV/fixed-width parsing with `csv-parse`, delimiter detection |
| `@connect/mapping` | Field mapping DSL, transformation runtime, deterministic HL7v2→FHIR and X12→FHIR mappers |
| `@connect/intelligence` | AI classifier, auto-mapper, schema inferrer, PHI scrubber, LLM provider abstraction, local embeddings |
| `@connect/connectors` | MLLP listener/sender, HTTP adapter, SFTP client, FHIR REST client, webhook sender with retry |
| `@connect/auth` | OAuth2/OIDC flows (Arctic), API key management, RBAC middleware, tenant isolation |

### STUB WORKER STAGES

The worker has handler registrations for all stages but only `ingested` (→ parse HL7v2) has real logic. These stages need implementation:

| Stage | What's Needed |
|-------|--------------|
| `classified` | Invoke classifier from `@connect/intelligence` for non-deterministic formats |
| `mapped` | Invoke mapping engine from `@connect/mapping` |
| `normalized` | Produce FHIR R4 Bundle, validate with `@connect/fhir` |
| `routed` | Evaluate trigger rules, determine destination IDs |
| `delivered` | Send to configured destinations via `@connect/connectors` |

### STUB WEB PAGES

All pages except Dashboard show "coming soon": Sources, Pipelines, Mappings, Messages, Destinations, Data Explorer, Settings.

### NOT YET CREATED

- `.github/workflows/ci.yml` — CI/CD pipeline
- Dockerfiles for server/worker
- Kubernetes/Helm charts
- E2E test suite (Playwright)
- `definitions/` content (HL7v2 message definitions, X12 schemas, FHIR StructureDefinitions, terminology subsets)

---

## 15. Roadmap & What's Next

### Phase 2: Parsers + Pipeline (Current Phase)

The foundation is built. Phase 2 makes data actually flow end-to-end.

**Priority order:**

1. **Remaining parsers** — Implement `@connect/x12` (X12/EDI), `@connect/fhir` (FHIR R4 resource helpers + validator + Bundle builder), `@connect/cda` (CDA XML), `@connect/flatfile` (CSV/TSV with delimiter detection)
2. **Mapping engine** (`@connect/mapping`) — Field mapping DSL, transformation runtime, deterministic HL7v2→FHIR mappings (PID→Patient, PV1→Encounter, OBR/OBX→DiagnosticReport/Observation)
3. **Remaining worker stages** — Wire up classified, mapped, normalized, routed, delivered stages with real logic
4. **Connectors** (`@connect/connectors`) — MLLP listener (TCP with HL7 framing), SFTP client (poll + push), webhook sender with retry/circuit-breaker, FHIR REST client
5. **HL7v2 definitions** — Populate `definitions/hl7v2/` with message structure definitions and common vendor profiles (Epic, Cerner, Meditech)

### Phase 3: Intelligence + UI

This is where the product becomes differentiated from competitors.

1. **Intelligence layer** (`@connect/intelligence`):
   - Auto-classifier (deterministic → fingerprint → LLM, 3-tier)
   - Auto-mapper (known → embeddings → LLM → learning, 4-tier)
   - PHI scrubber for safe LLM calls
   - LLM provider abstraction (OpenAI, Anthropic, Ollama)
   - Local embedding model via `@xenova/transformers`
   - Schema inferrer for flat files

2. **Full web UI** (`apps/web/`):
   - Pipeline builder (visual DAG editor + YAML code view)
   - Mapping editor (side-by-side source↔FHIR, AI suggestions with confidence, accept/reject)
   - Message inspector (browse envelopes, view each stage, lineage trail)
   - Sources + Destinations management
   - Data explorer (browse FHIR data lake)
   - Settings (tenant, users, API keys, LLM config)
   - Real-time updates via WebSocket

3. **Auth** (`@connect/auth`):
   - OAuth2/OIDC flows via Arctic
   - API key management with scoped permissions
   - RBAC middleware (owner/admin/editor/viewer)
   - Tenant isolation enforcement

### Phase 4: Hardening

Production readiness.

1. Data quality scoring engine (completeness, conformance, consistency, timeliness, uniqueness)
2. Replay/reprocessing capability (re-submit any envelope from S3 raw)
3. Alert/notification system (pipeline failures, quality thresholds, destination errors → Slack/email/PagerDuty)
4. Kubernetes Helm charts + Dockerfiles
5. CI/CD pipeline (`.github/workflows/ci.yml`)
6. E2E test suite with Playwright
7. Load testing — target: 1,000 HL7v2 messages/second sustained
8. Security audit (OWASP ZAP, dependency audit, PHI scrubber validation)

---

## 16. Feature Roadmap by Version

| Feature | Version | Description |
|---------|---------|-------------|
| **Data Quality Scoring** | v0.1 | Every FHIR resource gets a 0-100 quality score across 5 dimensions. Surface bad data instead of silently passing it. |
| **Audit Log** | v0.1 | Immutable, append-only. Every action logged. HIPAA non-negotiable. (Schema ready, writes not yet wired.) |
| **Data Lineage** | v0.1 | Every envelope tracks full lineage (transform ID, version, input/output SHA-256 hash, duration). (Envelope tracking implemented.) |
| **Multi-Tenancy** | v0.1 | `tenant_id` on every table. Tenant management API complete. (PostgreSQL RLS not yet enabled.) |
| **Alerts/Notifications** | v0.2 | Pipeline failures, quality threshold breaches, destination unreachable. Webhook → Slack/email/PagerDuty. |
| **Replay/Reprocessing** | v0.2 | Re-submit any envelope through its pipeline. Raw messages in S3 make this architecturally trivial. |
| **Analytics Dashboards** | v0.2 | Real-time views on data flowing through. Population-level insights on FHIR data lake. |
| **Patient Identity / MPI** | v0.3 | Probabilistic matching (identifiers + fuzzy demographics). Critical for multi-source deduplication. |
| **Terminology Services** | v0.3 | SNOMED, LOINC, ICD-10 lookups. Code validation, mapping, enrichment. |
| **Inferred Triggers** | v0.3 | Temporal pattern analysis across message history. ML models for clinical pattern detection (sepsis workup, readmission risk). |
| **Mapping Marketplace** | v0.4 | Community/vendor-contributed mapping templates, pipeline recipes, connector configs. |

---

## 17. Getting Started

### Prerequisites

- **Node.js 22+** (check with `node --version`)
- **pnpm 10.29+** (install: `corepack enable && corepack prepare pnpm@10.29.3 --activate`)
- **Docker** and **Docker Compose** (for PostgreSQL, NATS, Minio)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd connect

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL 16, NATS 2.10, Minio)
pnpm docker:up

# 4. Copy environment config
cp .env.example .env

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start all services in dev mode (server + worker + web)
pnpm dev
```

After startup:
- **Web UI**: http://localhost:5173
- **API Server**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **NATS Monitoring**: http://localhost:8222
- **Minio Console**: http://localhost:9001 (user: `connect`, password: `connectpass`)

### Common Commands

```bash
pnpm build        # Build all packages and apps (Turborepo cached)
pnpm test         # Run all tests (Vitest)
pnpm typecheck    # TypeScript type checking across all packages
pnpm lint         # Lint all packages
pnpm clean        # Clean all build artifacts
pnpm dev          # Start all services in dev mode with hot reload

pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed development data

pnpm docker:up    # Start infrastructure containers
pnpm docker:down  # Stop infrastructure containers
```

### Working on a Specific Package

```bash
# Run tests for just one package
pnpm --filter @connect/hl7v2 test

# Build just one package (and its dependencies)
npx turbo run build --filter=@connect/pipeline

# Type check a specific package
pnpm --filter @connect/types typecheck
```

---

## 18. Testing

**Framework**: Vitest 4.1

**Current test suite**: 52 tests passing

| Package | Test File | Tests | Coverage |
|---------|-----------|-------|----------|
| `@connect/queue` | `src/publisher.test.ts` | 3 | Subject building with tenant/pipeline/stage, wildcard support |
| `@connect/observability` | `src/logger.test.ts` | 3 | Logger creation with name and context, child loggers |
| `@connect/observability` | `src/metrics.test.ts` | 7 | Prometheus counters, histograms, gauges for all 6 metric types |
| `@connect/hl7v2` | `src/index.test.ts` | 11 | HL7v2 parsing, segment extraction, classification, format detection, ACK/NAK generation |
| `@connect/pipeline` | `src/index.test.ts` | 28 | YAML parsing, filter evaluation (all 9 operators), field resolution, pipeline execution, conditional stages, timeouts, error handling, lineage tracking |

**Testing philosophy:**
- Unit tests for each parser against real-world message samples
- Integration tests for full pipeline flow (planned)
- E2E tests with Playwright for web UI (planned)
- Load tests targeting 1,000 HL7v2 messages/second (planned)

**Running tests:**
```bash
# All tests
pnpm test

# Watch mode
npx vitest

# Single package
pnpm --filter @connect/pipeline test
```

---

## 19. Environment Variables

From `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://connect:connect@localhost:5432/connect` | PostgreSQL connection string |
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible object storage endpoint |
| `S3_ACCESS_KEY` | `connect` | S3 access key |
| `S3_SECRET_KEY` | `connectpass` | S3 secret key |
| `S3_BUCKET` | `connect-raw-messages` | S3 bucket for raw message storage |
| `HOST` | `0.0.0.0` | API server bind address |
| `PORT` | `3000` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (web app) |
| `LOG_LEVEL` | `info` | Pino log level (trace/debug/info/warn/error/fatal) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | (empty) | OpenTelemetry collector endpoint (optional) |
| `LLM_PROVIDER` | `none` | LLM provider: `none`, `openai`, `anthropic`, `ollama` |
| `OPENAI_API_KEY` | (empty) | OpenAI API key (if LLM_PROVIDER=openai) |
| `ANTHROPIC_API_KEY` | (empty) | Anthropic API key (if LLM_PROVIDER=anthropic) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL (if LLM_PROVIDER=ollama) |

---

## 20. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **NATS JetStream over Kafka** | NATS | Simpler operations (single binary), sub-3ms latency, built-in replay, excellent Node.js client. Kafka is overkill for our message volumes and adds significant ops burden. |
| **Separate server + workers** | Decoupled | No Mirth-style single-threaded bottleneck. Workers scale horizontally. Server handles API concerns only. |
| **S3 for raw, PostgreSQL for normalized** | Hybrid storage | Raw healthcare messages can be large and varied — cheap blob storage. Normalized FHIR data needs indexing and queries — relational DB. Keeps PostgreSQL lean. |
| **Pipeline-as-code (YAML)** | YAML definitions | Version-controllable, diffable, reviewable, deployable via CI/CD. Fixes Mirth's "channels stored in database" problem where pipeline changes are opaque. |
| **AI as suggestion layer only** | Never in critical path | System works fully with `LLM_PROVIDER=none`. AI suggests mappings/classifications; humans confirm. No PHI sent to external LLMs unless explicitly configured. Ollama option for zero data egress. |
| **FHIR R4 as canonical model** | Single normalization target | All formats (HL7v2, X12, CDA, CSV) normalize to FHIR R4. Creates a unified data layer. FHIR is the industry standard going forward. |
| **Multi-tenant from day one** | `tenant_id` everywhere | Every table, every NATS subject, every query is tenant-scoped. Avoids painful retrofit later. PostgreSQL RLS planned for defense in depth. |
| **Drizzle ORM over Prisma** | Drizzle | SQL-like syntax, better TypeScript inference, no code generation step, lighter runtime. |
| **Turborepo + pnpm** | Build system | Fast incremental builds with remote caching. pnpm's strict dependency hoisting prevents phantom deps. |
| **Envelope pattern** | Core abstraction | Every message carries its full processing history (raw, parsed, classified, mapped, normalized, routing, lineage, errors). Enables replay, debugging, and audit. |
