import { createLogger } from '@connect/observability';
import { getConnection, Publisher, Subscriber, type MessageHandler } from '@connect/queue';
import type { Envelope, EnvelopeStage } from '@connect/types';

const logger = createLogger('worker');

/**
 * Stage handler registry. Each stage has a handler that processes an envelope
 * and returns the updated envelope for the next stage.
 */
type StageHandler = (envelope: Envelope) => Promise<Envelope>;

const stageHandlers = new Map<EnvelopeStage, StageHandler>();

// Register built-in stage handlers
stageHandlers.set('ingested', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Processing ingested message');
  // TODO: Invoke parser based on source type / content sniffing
  return { ...envelope, stage: 'parsed' as const, updatedAt: new Date().toISOString() };
});

stageHandlers.set('parsed', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Classifying parsed message');
  // TODO: Invoke classifier from @connect/intelligence
  return { ...envelope, stage: 'classified' as const, updatedAt: new Date().toISOString() };
});

stageHandlers.set('classified', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Mapping classified message');
  // TODO: Invoke mapping engine from @connect/mapping
  return { ...envelope, stage: 'mapped' as const, updatedAt: new Date().toISOString() };
});

stageHandlers.set('mapped', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Normalizing mapped message');
  // TODO: Produce FHIR R4 Bundle, validate
  return { ...envelope, stage: 'normalized' as const, updatedAt: new Date().toISOString() };
});

stageHandlers.set('normalized', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Routing normalized message');
  // TODO: Evaluate trigger rules, determine destinations
  return { ...envelope, stage: 'routed' as const, updatedAt: new Date().toISOString() };
});

stageHandlers.set('routed', async (envelope) => {
  logger.info({ envelopeId: envelope.id }, 'Delivering routed message');
  // TODO: Send to configured destinations
  return { ...envelope, stage: 'delivered' as const, updatedAt: new Date().toISOString() };
});

const STAGES_TO_PROCESS: EnvelopeStage[] = [
  'ingested', 'parsed', 'classified', 'mapped', 'normalized', 'routed',
];

async function start() {
  const nc = await getConnection();
  const publisher = new Publisher();
  await publisher.init(nc);
  await publisher.ensureStream(nc);

  logger.info('Worker connected to NATS');

  for (const stage of STAGES_TO_PROCESS) {
    const subscriber = new Subscriber();
    await subscriber.init(nc);

    const handler: MessageHandler = async (envelope) => {
      const stageHandler = stageHandlers.get(stage);
      if (!stageHandler) {
        logger.warn({ stage }, 'No handler registered for stage');
        return;
      }

      try {
        const result = await stageHandler(envelope);
        // Publish to next stage
        if (result.stage !== 'delivered' && result.stage !== 'failed') {
          await publisher.publish(result);
        }
        logger.info({ envelopeId: envelope.id, stage: result.stage }, 'Stage completed');
      } catch (error) {
        logger.error({ envelopeId: envelope.id, stage, error }, 'Stage processing failed');
        const failed: Envelope = {
          ...envelope,
          stage: 'failed',
          errors: [
            ...envelope.errors,
            {
              stage,
              code: 'STAGE_ERROR',
              message: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
              retryable: true,
              retryCount: envelope.errors.filter(e => e.stage === stage).length,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        await publisher.publish(failed);
      }
    };

    // Subscribe in background (non-blocking)
    subscriber.subscribe(
      {
        tenantId: '*',
        pipelineId: '*',
        stage,
        durableName: `worker-${stage}`,
      },
      handler,
    ).catch((err) => {
      logger.error({ stage, err }, 'Subscriber failed');
    });

    logger.info({ stage }, 'Subscribed to stage');
  }

  logger.info('Worker started, listening for messages');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down worker...');
    await nc.drain();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error(err, 'Worker failed to start');
  process.exit(1);
});
