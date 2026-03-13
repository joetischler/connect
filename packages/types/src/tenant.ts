/**
 * Tenant, User, and RBAC types for multi-tenant SaaS.
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  /** Subscription tier */
  plan: 'starter' | 'professional' | 'enterprise';
  /** LLM provider configuration for this tenant */
  llmConfig?: LLMConfig;
  /** Whether this tenant is active */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'none';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  /** OAuth2/OIDC subject identifier */
  externalId?: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  /** Only returned on creation, then hashed */
  key?: string;
  keyHash: string;
  /** Scopes this key can access */
  scopes: ApiKeyScope[];
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  createdBy: string;
}

export type ApiKeyScope =
  | 'pipelines:read'
  | 'pipelines:write'
  | 'messages:read'
  | 'messages:write'
  | 'mappings:read'
  | 'mappings:write'
  | 'sources:read'
  | 'sources:write'
  | 'destinations:read'
  | 'destinations:write'
  | 'admin';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  actor: {
    type: 'user' | 'system' | 'api_key';
    id: string;
    name?: string;
  };
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve' | 'deploy' | 'login' | 'logout';
  resource: {
    type: string;
    id: string;
  };
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
