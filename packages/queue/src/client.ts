import { connect, type NatsConnection, type ConnectionOptions } from 'nats';

let connection: NatsConnection | null = null;

export interface QueueConfig {
  servers?: string | string[];
  token?: string;
  user?: string;
  pass?: string;
}

export async function getConnection(config?: QueueConfig): Promise<NatsConnection> {
  if (connection && !connection.isClosed()) {
    return connection;
  }

  const servers = config?.servers ?? process.env['NATS_URL'] ?? 'nats://localhost:4222';

  const opts: ConnectionOptions = {
    servers: Array.isArray(servers) ? servers : [servers],
  };

  if (config?.token) opts.token = config.token;
  if (config?.user) opts.user = config.user;
  if (config?.pass) opts.pass = config.pass;

  connection = await connect(opts);
  return connection;
}

export async function closeConnection(): Promise<void> {
  if (connection && !connection.isClosed()) {
    await connection.drain();
    connection = null;
  }
}
