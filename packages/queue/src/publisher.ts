import { type JetStreamClient, type JetStreamManager, type NatsConnection, StringCodec } from 'nats';
import type { Envelope, EnvelopeStage } from '@connect/types';
import { getConnection } from './client.js';

const sc = StringCodec();

/**
 * Build a NATS subject for a pipeline stage.
 * Format: connect.{tenantId}.pipeline.{pipelineId}.{stage}
 */
export function buildSubject(tenantId: string, pipelineId: string, stage: EnvelopeStage): string {
  return `connect.${tenantId}.pipeline.${pipelineId}.${stage}`;
}

export class Publisher {
  private js: JetStreamClient | null = null;

  async init(nc?: NatsConnection): Promise<void> {
    const conn = nc ?? await getConnection();
    this.js = conn.jetstream();
  }

  async ensureStream(nc?: NatsConnection): Promise<void> {
    const conn = nc ?? await getConnection();
    const jsm: JetStreamManager = await conn.jetstreamManager();

    try {
      await jsm.streams.info('CONNECT');
    } catch {
      await jsm.streams.add({
        name: 'CONNECT',
        subjects: ['connect.>'],
        retention: 'limits' as unknown as import('nats').RetentionPolicy,
        max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days in nanoseconds
        storage: 'file' as unknown as import('nats').StorageType,
        num_replicas: 1,
      });
    }
  }

  async publish(envelope: Envelope): Promise<void> {
    if (!this.js) {
      await this.init();
    }

    const subject = buildSubject(envelope.tenantId, envelope.pipelineId, envelope.stage);
    const data = sc.encode(JSON.stringify(envelope));

    await this.js!.publish(subject, data, {
      msgID: envelope.id,
    });
  }
}
