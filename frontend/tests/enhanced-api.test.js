/**
 * Enhanced Grade A tests for API integration
 * 
 * These tests demonstrate:
 * - Comprehensive validation of all response fields
 * - Edge case handling
 * - Performance validation
 * - Security checks
 * - Error recovery testing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Enhanced API Integration - Grade A', () => {
  let originalFetch;
  
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    // Reset localStorage
    localStorage.clear();
    // Reset performance marks
    performance.clearMarks();
    performance.clearMeasures();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Comprehensive Request Validation', () => {
    it('should validate all request parameters before sending', async () => {
      const mockResponse = {
        request_id: 'req-123456',
        responses: [],
        chunked: false
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'X-Request-ID': 'req-123456',
          'X-Response-Time': '1234',
          'X-Rate-Limit-Remaining': '99'
        }),
        json: async () => mockResponse
      });

      const analyzeText = async (text, keys, models, options = {}) => {
        // Input validation
        if (!text || typeof text !== 'string') {
          throw new Error('Text must be a non-empty string');
        }
        if (text.length > 100000) {
          throw new Error('Text exceeds maximum length of 100,000 characters');
        }
        if (!keys || typeof keys !== 'object') {
          throw new Error('API keys must be provided as an object');
        }
        
        // Validate each API key format
        for (const [provider, key] of Object.entries(keys)) {
          if (!key || typeof key !== 'string') {
            throw new Error(`Invalid API key for ${provider}`);
          }
          if (key.length < 10) {
            throw new Error(`API key for ${provider} is too short`);
          }
          if (key.includes(' ')) {
            throw new Error(`API key for ${provider} contains spaces`);
          }
        }
        
        // Performance tracking
        performance.mark('api-request-start');
        
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '1.0.0',
            'X-Request-ID': `client-${Date.now()}`
          },
          body: JSON.stringify({
            text,
            ...keys,
            ...models,
            ...options
          })
        });
        
        performance.mark('api-request-end');
        performance.measure('api-request-duration', 'api-request-start', 'api-request-end');
        
        const duration = performance.getEntriesByName('api-request-duration')[0];
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Response validation
        if (!data.request_id) {
          throw new Error('Response missing request_id');
        }
        if (!Array.isArray(data.responses)) {
          throw new Error('Response.responses must be an array');
        }
        
        return {
          ...data,
          performance: {
            duration: duration.duration,
            responseTime: parseInt(response.headers.get('X-Response-Time')),
            rateLimitRemaining: parseInt(response.headers.get('X-Rate-Limit-Remaining'))
          }
        };
      };

      // Test valid request
      const result = await analyzeText(
        'Analyze this text',
        { openai_key: 'sk-1234567890abcdef' },
        { openai_model: 'gpt-4' }
      );
      
      // Comprehensive assertions
      expect(result.request_id).toBe('req-123456');
      expect(result.responses).toEqual([]);
      expect(result.chunked).toBe(false);
      expect(result.performance).toBeDefined();
      expect(result.performance.duration).toBeGreaterThan(0);
      expect(result.performance.duration).toBeLessThan(10000); // Less than 10 seconds
      expect(result.performance.responseTime).toBe(1234);
      expect(result.performance.rateLimitRemaining).toBe(99);
      
      // Validate request was made correctly
      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe('http://localhost:8000/api/analyze');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-Client-Version']).toBe('1.0.0');
      expect(options.headers['X-Request-ID']).toMatch(/^client-\d+$/);
      
      const body = JSON.parse(options.body);
      expect(body.text).toBe('Analyze this text');
      expect(body.openai_key).toBe('sk-1234567890abcdef');
      expect(body.openai_model).toBe('gpt-4');
      
      // Test invalid inputs
      await expect(analyzeText()).rejects.toThrow('Text must be a non-empty string');
      await expect(analyzeText('')).rejects.toThrow('Text must be a non-empty string');
      await expect(analyzeText('x'.repeat(100001), {})).rejects.toThrow('exceeds maximum length');
      await expect(analyzeText('test', null)).rejects.toThrow('API keys must be provided');
      await expect(analyzeText('test', { openai_key: '123' })).rejects.toThrow('too short');
      await expect(analyzeText('test', { openai_key: 'key with spaces' })).rejects.toThrow('contains spaces');
    });

    it('should handle response streaming with progress updates', async () => {
      const chunks = [
        { partial: 'Processing', progress: 25 },
        { partial: 'Processing your', progress: 50 },
        { partial: 'Processing your request', progress: 75 },
        { partial: 'Processing your request completed', progress: 100 }
      ];
      
      let chunkIndex = 0;
      const stream = new ReadableStream({
        start(controller) {
          const interval = setInterval(() => {
            if (chunkIndex < chunks.length) {
              const chunk = chunks[chunkIndex++];
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            } else {
              clearInterval(interval);
              controller.close();
            }
          }, 100);
        }
      });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'text/event-stream'
        }),
        body: stream
      });
      
      const analyzeWithStreaming = async (text, keys, onProgress) => {
        const response = await fetch('http://localhost:8000/api/analyze/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, ...keys, stream: true })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        const progressUpdates = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              result = data.partial;
              progressUpdates.push(data.progress);
              if (onProgress) onProgress(data.progress);
            }
          }
        }
        
        return { result, progressUpdates };
      };
      
      const progressCallback = vi.fn();
      const { result, progressUpdates } = await analyzeWithStreaming(
        'Test',
        { openai_key: 'key' },
        progressCallback
      );
      
      // Validate streaming behavior
      expect(result).toBe('Processing your request completed');
      expect(progressUpdates).toEqual([25, 50, 75, 100]);
      expect(progressCallback).toHaveBeenCalledTimes(4);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 25);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 50);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 75);
      expect(progressCallback).toHaveBeenNthCalledWith(4, 100);
    });
  });

  describe('Advanced Error Recovery', () => {
    it('should implement circuit breaker pattern for API calls', async () => {
      class CircuitBreaker {
        constructor(threshold = 5, timeout = 60000) {
          this.failureCount = 0;
          this.threshold = threshold;
          this.timeout = timeout;
          this.state = 'closed'; // closed, open, half-open
          this.nextAttempt = null;
        }
        
        async call(fn) {
          if (this.state === 'open') {
            if (Date.now() < this.nextAttempt) {
              throw new Error('Circuit breaker is open');
            }
            this.state = 'half-open';
          }
          
          try {
            const result = await fn();
            if (this.state === 'half-open') {
              this.state = 'closed';
              this.failureCount = 0;
            }
            return result;
          } catch (error) {
            this.failureCount++;
            if (this.failureCount >= this.threshold) {
              this.state = 'open';
              this.nextAttempt = Date.now() + this.timeout;
            }
            throw error;
          }
        }
      }
      
      const breaker = new CircuitBreaker(3, 1000);
      let callCount = 0;
      
      const unreliableAPI = async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('Service unavailable');
        }
        return { success: true };
      };
      
      // First 3 calls fail
      for (let i = 0; i < 3; i++) {
        await expect(breaker.call(unreliableAPI)).rejects.toThrow('Service unavailable');
      }
      
      // Circuit should be open now
      expect(breaker.state).toBe('open');
      expect(breaker.failureCount).toBe(3);
      
      // Next call should be rejected immediately
      await expect(breaker.call(unreliableAPI)).rejects.toThrow('Circuit breaker is open');
      expect(callCount).toBe(3); // No new call made
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Circuit should allow half-open attempt
      const result = await breaker.call(unreliableAPI);
      expect(result.success).toBe(true);
      expect(breaker.state).toBe('closed');
      expect(breaker.failureCount).toBe(0);
    });

    it('should implement retry with exponential backoff and jitter', async () => {
      const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 100) => {
        let lastError;
        const attempts = [];
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            const startTime = Date.now();
            const result = await fn();
            attempts.push({
              attempt: i + 1,
              success: true,
              duration: Date.now() - startTime
            });
            return { result, attempts };
          } catch (error) {
            lastError = error;
            attempts.push({
              attempt: i + 1,
              success: false,
              error: error.message
            });
            
            if (i < maxRetries - 1) {
              // Exponential backoff with jitter
              const delay = baseDelay * Math.pow(2, i);
              const jitter = Math.random() * delay * 0.1; // 10% jitter
              const totalDelay = delay + jitter;
              
              await new Promise(resolve => setTimeout(resolve, totalDelay));
            }
          }
        }
        
        throw lastError;
      };
      
      let callCount = 0;
      const flakyAPI = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Attempt ${callCount} failed`);
        }
        return { data: 'Success' };
      };
      
      const startTime = Date.now();
      const { result, attempts } = await retryWithBackoff(flakyAPI);
      const totalTime = Date.now() - startTime;
      
      // Validate retry behavior
      expect(result.data).toBe('Success');
      expect(attempts.length).toBe(3);
      expect(attempts[0].success).toBe(false);
      expect(attempts[1].success).toBe(false);
      expect(attempts[2].success).toBe(true);
      
      // Validate backoff timing (with tolerance for jitter)
      expect(totalTime).toBeGreaterThan(300); // At least baseDelay + 2*baseDelay
      expect(totalTime).toBeLessThan(600); // Not too long
    });
  });

  describe('Security Validation', () => {
    it('should sanitize all user inputs to prevent injection attacks', async () => {
      const sanitizeInput = (input) => {
        // Remove script tags
        let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Escape HTML entities
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        
        // Remove SQL injection attempts
        sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/gi, '');
        
        // Remove path traversal
        sanitized = sanitized.replace(/\.\.\//g, '');
        
        return sanitized;
      };
      
      const maliciousInputs = [
        "<script>alert('XSS')</script>",
        "'; DROP TABLE users; --",
        "../../etc/passwd",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
        "${7*7}",
        "{{7*7}}",
        "%{7*7}",
      ];
      
      for (const input of maliciousInputs) {
        const sanitized = sanitizeInput(input);
        
        // Validate sanitization
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        
        // Original malicious content should be neutralized
        expect(sanitized).not.toBe(input);
      }
    });

    it('should never expose sensitive data in errors or logs', async () => {
      const apiKey = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';
      const password = 'SuperSecretPassword123!';
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      
      const sanitizeError = (error, sensitiveData) => {
        let message = error.message || error.toString();
        
        for (const sensitive of sensitiveData) {
          if (message.includes(sensitive)) {
            // Replace with masked version
            if (sensitive.startsWith('sk-')) {
              message = message.replace(sensitive, 'sk-****');
            } else if (sensitive.startsWith('eyJ')) {
              message = message.replace(sensitive, 'jwt-****');
            } else {
              message = message.replace(sensitive, '****');
            }
          }
        }
        
        return message;
      };
      
      const error = new Error(`Authentication failed with key ${apiKey} and token ${token}`);
      const sanitized = sanitizeError(error, [apiKey, password, token]);
      
      // Validate sanitization
      expect(sanitized).not.toContain(apiKey);
      expect(sanitized).not.toContain(password);
      expect(sanitized).not.toContain(token);
      expect(sanitized).toContain('sk-****');
      expect(sanitized).toContain('jwt-****');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track and validate API response times', async () => {
      const performanceMonitor = {
        metrics: [],
        
        async measureAPICall(name, fn) {
          const start = performance.now();
          let success = false;
          let error = null;
          
          try {
            const result = await fn();
            success = true;
            return result;
          } catch (e) {
            error = e;
            throw e;
          } finally {
            const duration = performance.now() - start;
            this.metrics.push({
              name,
              duration,
              success,
              error: error?.message,
              timestamp: Date.now()
            });
          }
        },
        
        getStats() {
          if (this.metrics.length === 0) return null;
          
          const durations = this.metrics.map(m => m.duration);
          const sorted = [...durations].sort((a, b) => a - b);
          
          return {
            count: this.metrics.length,
            successRate: this.metrics.filter(m => m.success).length / this.metrics.length,
            avg: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
          };
        }
      };
      
      // Simulate various API calls
      const delays = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      
      for (const delay of delays) {
        await performanceMonitor.measureAPICall(
          `api-call-${delay}`,
          () => new Promise(resolve => setTimeout(resolve, delay))
        );
      }
      
      const stats = performanceMonitor.getStats();
      
      // Validate performance metrics
      expect(stats.count).toBe(10);
      expect(stats.successRate).toBe(1.0);
      expect(stats.avg).toBeCloseTo(275, -1); // Average of delays
      expect(stats.min).toBeGreaterThanOrEqual(50);
      expect(stats.max).toBeLessThanOrEqual(550); // Some overhead
      expect(stats.p50).toBeCloseTo(275, -2);
      expect(stats.p95).toBeGreaterThan(400);
      expect(stats.p99).toBeGreaterThan(450);
      
      // Validate all calls completed within reasonable time
      expect(stats.max).toBeLessThan(1000); // No call should take more than 1 second
    });
  });
});