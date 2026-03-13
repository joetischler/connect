import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@connect/observability';
import { registerHealthRoutes } from './routes/health.js';
import { registerPipelineRoutes } from './routes/pipelines.js';
import { registerSourceRoutes } from './routes/sources.js';
import { registerDestinationRoutes } from './routes/destinations.js';
import { registerTenantRoutes } from './routes/tenants.js';
import { registerEnvelopeRoutes } from './routes/envelopes.js';
import { createDb } from '@connect/db';

const logger = createLogger('server');

async function start() {
  const app = Fastify({
    logger: false, // We use our own pino logger
  });

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  });

  // Database connection
  const db = createDb();
  app.decorate('db', db);

  // Register route modules
  registerHealthRoutes(app);
  registerPipelineRoutes(app);
  registerSourceRoutes(app);
  registerDestinationRoutes(app);
  registerTenantRoutes(app);
  registerEnvelopeRoutes(app);

  const host = process.env['HOST'] ?? '0.0.0.0';
  const port = parseInt(process.env['PORT'] ?? '3000', 10);

  try {
    await app.listen({ host, port });
    logger.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();
