import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { tenants, users } from '@connect/db';
import type { Database } from '@connect/db';

export function registerTenantRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: Database }).db;

  app.get('/api/v1/tenants', async () => {
    const results = await db.select().from(tenants);
    return { data: results };
  });

  app.post('/api/v1/tenants', async (request) => {
    const body = request.body as {
      name: string;
      slug: string;
      plan?: string;
      ownerEmail: string;
      ownerName: string;
    };

    const [tenant] = await db
      .insert(tenants)
      .values({
        name: body.name,
        slug: body.slug,
        plan: body.plan ?? 'starter',
      })
      .returning();

    // Create the owner user for this tenant
    const [owner] = await db
      .insert(users)
      .values({
        tenantId: tenant!.id,
        email: body.ownerEmail,
        name: body.ownerName,
        role: 'owner',
      })
      .returning();

    return { data: { tenant, owner } };
  });

  app.get<{ Params: { id: string } }>('/api/v1/tenants/:id', async (request) => {
    const results = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, request.params.id));

    if (results.length === 0) return { error: 'Not found' };
    return { data: results[0] };
  });

  app.put<{ Params: { id: string } }>('/api/v1/tenants/:id', async (request) => {
    const body = request.body as Partial<{
      name: string;
      plan: string;
      llmConfig: Record<string, unknown>;
      active: boolean;
    }>;

    const [tenant] = await db
      .update(tenants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tenants.id, request.params.id))
      .returning();

    if (!tenant) return { error: 'Not found' };
    return { data: tenant };
  });
}
