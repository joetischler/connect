import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { destinations } from '@connect/db';
import type { Database } from '@connect/db';

export function registerDestinationRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: Database }).db;

  app.get('/api/v1/destinations', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const results = await db.select().from(destinations).where(eq(destinations.tenantId, tenantId));
    return { data: results };
  });

  app.post('/api/v1/destinations', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as {
      name: string;
      description?: string;
      type: string;
      config: Record<string, unknown>;
      retryConfig?: Record<string, unknown>;
    };

    const [destination] = await db
      .insert(destinations)
      .values({ tenantId, ...body })
      .returning();

    return { data: destination };
  });

  app.put<{ Params: { id: string } }>('/api/v1/destinations/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const body = request.body as Partial<{
      name: string;
      description: string;
      config: Record<string, unknown>;
      retryConfig: Record<string, unknown>;
      enabled: boolean;
    }>;

    const [destination] = await db
      .update(destinations)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(destinations.tenantId, tenantId), eq(destinations.id, request.params.id)))
      .returning();

    if (!destination) return { error: 'Not found' };
    return { data: destination };
  });

  app.delete<{ Params: { id: string } }>('/api/v1/destinations/:id', async (request) => {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) return { error: 'Missing x-tenant-id header' };

    const [destination] = await db
      .delete(destinations)
      .where(and(eq(destinations.tenantId, tenantId), eq(destinations.id, request.params.id)))
      .returning();

    if (!destination) return { error: 'Not found' };
    return { data: { deleted: true } };
  });
}
