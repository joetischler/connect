import type { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { envelopes } from '@connect/db';
import type { Database } from '@connect/db';

export function registerEnvelopeRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: Database }).db;

  app.get('/api/v1/envelopes', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const query = request.query as { pipelineId?: string; stage?: string; limit?: string };
    const limit = Math.min(parseInt(query.limit ?? '50', 10), 200);

    let conditions = eq(envelopes.tenantId, tenantId);
    if (query.pipelineId) {
      conditions = and(conditions, eq(envelopes.pipelineId, query.pipelineId))!;
    }
    if (query.stage) {
      conditions = and(conditions, eq(envelopes.stage, query.stage))!;
    }

    const results = await db
      .select()
      .from(envelopes)
      .where(conditions)
      .orderBy(desc(envelopes.createdAt))
      .limit(limit);

    return { data: results };
  });

  app.get<{ Params: { id: string } }>('/api/v1/envelopes/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const results = await db
      .select()
      .from(envelopes)
      .where(and(eq(envelopes.tenantId, tenantId), eq(envelopes.id, request.params.id)));

    if (results.length === 0) return { error: 'Not found' };
    return { data: results[0] };
  });
}
