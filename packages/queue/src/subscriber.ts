import {
  type JetStreamClient,
  type JetStreamManager,
  type NatsConnection,
  type ConsumerConfig,
  type JsMsg,
  StringCodec,
  AckPolicy,
  DeliverPolicy,
} from 'nats';
import type { Envelope, EnvelopeStage } from '@connect/types';
import { getConnection } from './client.js';
import { buildSubject } from './publisher.js';

const sc = StringCodec();

export type MessageHandler = (envelope: Envelope, msg: JsMsg) => Promise<void>;

export interface SubscribeOptions {
  /** Tenant ID to subscribe to (use '*' for all tenants) */
  tenantId: string;
  /** Pipeline ID to subscribe to (use '*' for all pipelines) */
  pipelineId: string;
  /** Stage to subscribe to */
  stage: EnvelopeStage;
  /** Durable consumer name */
  durableName: string;
  /** Max number of messages to process concurrently */
  maxConcurrent?: number;
  /** Ack wait timeout in milliseconds */
  ackWaitMs?: number;
}

export class Subscriber {
  private js: JetStreamClient | null = null;
  private nc: NatsConnection | null = null;

  async init(nc?: NatsConnection): Promise<void> {
    this.nc = nc ?? await getConnection();
    this.js = this.nc.jetstream();
  }

  async subscribe(options: SubscribeOptions, handler: MessageHandler): Promise<void> {
    if (!this.js || !this.nc) {
      await this.init();
    }

    const subject = buildSubject(options.tenantId, options.pipelineId, options.stage);
    const jsm: JetStreamManager = await this.nc!.jetstreamManager();

    const consumerConfig: Partial<ConsumerConfig> = {
      durable_name: options.durableName,
      filter_subject: subject,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      max_ack_pending: options.maxConcurrent ?? 10,
      ack_wait: (options.ackWaitMs ?? 30000) * 1_000_000, // Convert to nanoseconds
    };

    await jsm.consumers.add('CONNECT', consumerConfig);

    const consumer = await this.js!.consumers.get('CONNECT', options.durableName);
    const messages = await consumer.consume();

    for await (const msg of messages) {
      try {
        const data = sc.decode(msg.data);
        const envelope: Envelope = JSON.parse(data);
        await handler(envelope, msg);
        msg.ack();
      } catch (error) {
        msg.nak();
        console.error(`Error processing message on ${subject}:`, error);
      }
    }
  }
}
