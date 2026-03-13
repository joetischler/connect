import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { pipelines } from '@connect/db';
import type { Database } from '@connect/db';

export function registerPipelineRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: Database }).db;

  app.get('/api/v1/pipelines', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const results = await db.select().from(pipelines).where(eq(pipelines.tenantId, tenantId));
    return { data: results };
  });

  app.get<{ Params: { id: string } }>('/api/v1/pipelines/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const results = await db
      .select()
      .from(pipelines)
      .where(and(eq(pipelines.tenantId, tenantId), eq(pipelines.id, request.params.id)));

    if (results.length === 0) return { error: 'Not found' };
    return { data: results[0] };
  });

  app.post('/api/v1/pipelines', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as {
      name: string;
      description?: string;
      definition: string;
      createdBy: string;
    };

    const [pipeline] = await db
      .insert(pipelines)
      .values({
        tenantId,
        name: body.name,
        description: body.description,
        definition: body.definition,
        createdBy: body.createdBy,
      })
      .returning();

    return { data: pipeline };
  });

  app.put<{ Params: { id: string } }>('/api/v1/pipelines/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as {
      name?: string;
      description?: string;
      definition?: string;
      enabled?: boolean;
      status?: string;
    };

    const [pipeline] = await db
      .update(pipelines)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(pipelines.tenantId, tenantId), eq(pipelines.id, request.params.id)))
      .returning();

    if (!pipeline) return { error: 'Not found' };
    return { data: pipeline };
  });

  app.delete<{ Params: { id: string } }>('/api/v1/pipelines/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const [pipeline] = await db
      .delete(pipelines)
      .where(and(eq(pipelines.tenantId, tenantId), eq(pipelines.id, request.params.id)))
      .returning();

    if (!pipeline) return { error: 'Not found' };
    return { data: { deleted: true } };
  });
}
