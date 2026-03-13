import pino from 'pino';

export interface LogContext {
  tenantId?: string;
  pipelineId?: string;
  envelopeId?: string;
  traceId?: string;
  stage?: string;
}

const baseLogger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: process.env['NODE_ENV'] === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with tenant/pipeline context.
 */
export function createLogger(name: string, context?: LogContext) {
  return baseLogger.child({ name, ...context });
}

export type Logger = ReturnType<typeof createLogger>;
