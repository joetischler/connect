import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { sources } from '@connect/db';
import type { Database } from '@connect/db';

export function registerSourceRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: Database }).db;

  app.get('/api/v1/sources', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const results = await db.select().from(sources).where(eq(sources.tenantId, tenantId));
    return { data: results };
  });

  app.post('/api/v1/sources', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as {
      name: string;
      description?: string;
      type: string;
      config: Record<string, unknown>;
      pipelineId?: string;
    };

    const [source] = await db
      .insert(sources)
      .values({ tenantId, ...body })
      .returning();

    return { data: source };
  });

  app.put<{ Params: { id: string } }>('/api/v1/sources/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as Partial<{
      name: string;
      description: string;
      config: Record<string, unknown>;
      pipelineId: string;
      enabled: boolean;
    }>;

    const [source] = await db
      .update(sources)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(sources.tenantId, tenantId), eq(sources.id, request.params.id)))
      .returning();

    if (!source) return { error: 'Not found' };
    return { data: source };
  });

  app.delete<{ Params: { id: string } }>('/api/v1/sources/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const [source] = await db
      .delete(sources)
      .where(and(eq(sources.tenantId, tenantId), eq(sources.id, request.params.id)))
      .returning();

    if (!source) return { error: 'Not found' };
    return { data: { deleted: true } };
  });
}
