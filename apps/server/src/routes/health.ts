import type { FastifyInstance } from 'fastify';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async () => {
    // TODO: Check database and NATS connectivity
    return { status: 'ready', timestamp: new Date().toISOString() };
  });
}
