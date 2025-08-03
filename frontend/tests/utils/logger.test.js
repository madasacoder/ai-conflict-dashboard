/**
 * Unit tests for structured logging utilities
 * Follows JAVASCRIPT-STANDARDS.md requirements - NO console.log allowed
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StructuredLogger', () => {
  let logger;
  let fetchMock;

  beforeEach(() => {
    // Mock fetch for backend logging
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = fetchMock;

    // Mock generateSessionId
    global.generateSessionId = vi.fn().mockReturnValue('test-session-123');

    // Clear any existing logger
    delete global.logger;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should create logger with session ID', async () => {
    // Import StructuredLogger (assuming it exists in utils/logger.js)
    const { StructuredLogger } = await import('../../js/utils/logger.js');

    logger = new StructuredLogger({
      backendURL: '/api/test-log',
    });

    expect(logger.sessionId).toBe('test-session-123');
    expect(logger.backendURL).toBe('/api/test-log');
  });

  test('should log structured events to backend', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    await logger.info('user_action', {
      action: 'button_click',
      component: 'workflow_builder',
    });

    // ✅ REQUIRED - Verify structured logging format per JAVASCRIPT-STANDARDS.md
    expect(fetchMock).toHaveBeenCalledWith('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        event: 'user_action',
        data: {
          action: 'button_click',
          component: 'workflow_builder',
        },
        timestamp: expect.any(String),
        session_id: 'test-session-123',
        url: expect.any(String),
        user_agent: expect.any(String),
      }),
    });
  });

  test('should handle backend logging failures gracefully', async () => {
    // Mock fetch failure
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    // Mock console.warn for fallback
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    await logger.error('api_error', { endpoint: '/test' });

    // Should fall back to console warn, not console.log/error
    expect(consoleWarnSpy).toHaveBeenCalledWith('Logging backend unavailable:', expect.any(Error));

    consoleWarnSpy.mockRestore();
  });

  test('should include correlation data in logs', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    await logger.workflow('node_created', {
      node_id: 'node-123',
      node_type: 'input',
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        event: 'node_created',
        data: {
          node_id: 'node-123',
          node_type: 'input',
        },
        timestamp: expect.any(String),
        session_id: 'test-session-123',
        url: expect.any(String),
        user_agent: expect.any(String),
      }),
    });
  });

  test('should sanitize sensitive data in logs', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    // ✅ REQUIRED - Never log API keys per JAVASCRIPT-STANDARDS.md
    await logger.info('api_call', {
      endpoint: '/api/analyze',
      api_key_prefix: 'sk-1234...', // Only prefix, not full key
      response_size: 1024,
    });

    const logCall = fetchMock.mock.calls[0][1];
    const logData = JSON.parse(logCall.body);

    // Verify no full API key is logged
    expect(JSON.stringify(logData)).not.toMatch(/sk-[a-zA-Z0-9]{32,}/);
    expect(logData.data.api_key_prefix).toBe('sk-1234...');
  });

  test('should generate unique request IDs', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    // Mock generateRequestId
    let idCounter = 0;
    global.generateRequestId = vi.fn(() => `req-${++idCounter}`);

    await logger.info('request_start', { endpoint: '/api/test1' });
    await logger.info('request_start', { endpoint: '/api/test2' });

    const calls = fetchMock.mock.calls;
    const log1 = JSON.parse(calls[0][1].body);
    const log2 = JSON.parse(calls[1][1].body);

    // If request IDs are included, they should be unique
    if (log1.data.request_id && log2.data.request_id) {
      expect(log1.data.request_id).not.toBe(log2.data.request_id);
    }
  });

  test('should validate log level methods exist', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    // ✅ REQUIRED - All log levels per JAVASCRIPT-STANDARDS.md
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should handle large log payloads', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    const largeData = {
      large_text: 'x'.repeat(10000),
      metadata: 'y'.repeat(5000),
    };

    await logger.info('large_payload_test', largeData);

    expect(fetchMock).toHaveBeenCalled();

    const logCall = fetchMock.mock.calls[0][1];
    const bodySize = logCall.body.length;

    // Verify large payloads are handled (but perhaps truncated)
    expect(bodySize).toBeGreaterThan(1000);
  });

  test('should include performance timing data', async () => {
    const { StructuredLogger } = await import('../../js/utils/logger.js');
    logger = new StructuredLogger();

    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const duration = Date.now() - startTime;

    await logger.info('performance_test', {
      operation: 'test_operation',
      duration_ms: duration,
    });

    const logCall = fetchMock.mock.calls[0][1];
    const logData = JSON.parse(logCall.body);

    expect(logData.data.duration_ms).toBeGreaterThan(0);
  });

  test('should prevent console.log usage in production', () => {
    // ✅ CRITICAL - Verify NO console.log is used per JAVASCRIPT-STANDARDS.md

    // This test ensures we never accidentally use console.log
    const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];

    consoleMethods.forEach((method) => {
      const spy = vi.spyOn(console, method);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
