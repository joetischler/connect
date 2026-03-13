import { describe, it, expect } from 'vitest';
import { createLogger } from './logger.js';

describe('createLogger', () => {
  it('creates a logger with a name', () => {
    const logger = createLogger('test-service');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('creates a logger with context', () => {
    const logger = createLogger('test-service', {
      tenantId: 't1',
      pipelineId: 'p1',
      envelopeId: 'env-123',
    });
    expect(logger).toBeDefined();
  });

  it('supports child loggers', () => {
    const parent = createLogger('parent');
    const child = parent.child({ requestId: 'req-1' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});
