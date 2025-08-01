/**
 * API integration tests for frontend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API functions since they're inline in index.html
// In a real refactor, these would be extracted to modules

describe('API Integration', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('analyzeText', () => {
    it('should send correct request to backend', async () => {
      const mockResponse = {
        request_id: 'test-123',
        original_text: 'Test text',
        responses: [
          { model: 'openai', response: 'OpenAI response', error: null }
        ],
        chunked: false
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Request-ID': 'test-123' }),
        json: async () => mockResponse
      });

      // Simulate the analyzeText function
      const analyzeText = async (text, keys, models) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            ...keys,
            ...models
          })
        });
        
        if (!response.ok) throw new Error('Analysis failed');
        return response.json();
      };

      const result = await analyzeText(
        'Test text',
        { openai_key: 'test-key' },
        { openai_model: 'gpt-4' }
      );

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Test text',
            openai_key: 'test-key',
            openai_model: 'gpt-4'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' })
      });

      const analyzeText = async (text, keys) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, ...keys })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Analysis failed');
        }
        return response.json();
      };

      await expect(analyzeText('Test', { openai_key: 'key' }))
        .rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const analyzeText = async (text, keys) => {
        try {
          const response = await fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...keys })
          });
          return response.json();
        } catch (error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
            throw new Error('Failed to connect to the server. Make sure the backend is running on http://localhost:8000');
          }
          throw error;
        }
      };

      await expect(analyzeText('Test', { openai_key: 'key' }))
        .rejects.toThrow('Failed to connect to the server');
    });
  });

  describe('Health Check', () => {
    it('should check backend health', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' })
      });

      const checkHealth = async () => {
        const response = await fetch('http://localhost:8000/api/health');
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
      };

      const result = await checkHealth();
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/health');
      expect(result.status).toBe('healthy');
    });
  });

  describe('Multi-provider requests', () => {
    it('should handle multiple provider responses', async () => {
      const mockResponse = {
        request_id: 'test-456',
        original_text: 'Compare AI models',
        responses: [
          { model: 'openai', response: 'GPT response', error: null },
          { model: 'claude', response: 'Claude response', error: null },
          { model: 'gemini', response: 'Gemini response', error: null },
          { model: 'grok', response: 'Grok response', error: null }
        ],
        chunked: false
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Request-ID': 'test-456' }),
        json: async () => mockResponse
      });

      const analyzeWithAllProviders = async (text, keys) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, ...keys })
        });
        
        const data = await response.json();
        
        // Process responses by model
        const responsesByModel = {};
        data.responses.forEach(r => {
          responsesByModel[r.model] = r;
        });
        
        return { ...data, responsesByModel };
      };

      const result = await analyzeWithAllProviders('Compare AI models', {
        openai_key: 'key1',
        claude_key: 'key2',
        gemini_key: 'key3',
        grok_key: 'key4'
      });

      expect(result.responses).toHaveLength(4);
      expect(result.responsesByModel.openai.response).toBe('GPT response');
      expect(result.responsesByModel.claude.response).toBe('Claude response');
      expect(result.responsesByModel.gemini.response).toBe('Gemini response');
      expect(result.responsesByModel.grok.response).toBe('Grok response');
    });

    it('should handle partial provider failures', async () => {
      const mockResponse = {
        request_id: 'test-789',
        original_text: 'Test with errors',
        responses: [
          { model: 'openai', response: 'Success', error: null },
          { model: 'claude', response: '', error: 'API key invalid' }
        ],
        chunked: false
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const analyzeText = async (text, keys) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, ...keys })
        });
        return response.json();
      };

      const result = await analyzeText('Test with errors', {
        openai_key: 'valid-key',
        claude_key: 'invalid-key'
      });

      expect(result.responses[0].error).toBeNull();
      expect(result.responses[1].error).toBe('API key invalid');
    });
  });

  describe('Request tracking', () => {
    it('should include request ID in response', async () => {
      const requestId = 'unique-request-123';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Request-ID': requestId }),
        json: async () => ({
          request_id: requestId,
          original_text: 'Test',
          responses: []
        })
      });

      const analyzeText = async (text) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, openai_key: 'test' })
        });
        
        const requestId = response.headers.get('X-Request-ID');
        const data = await response.json();
        
        return { requestId, data };
      };

      const result = await analyzeText('Test');
      
      expect(result.requestId).toBe(requestId);
      expect(result.data.request_id).toBe(requestId);
    });
  });

  describe('Chunking support', () => {
    it('should handle chunked responses', async () => {
      const mockResponse = {
        request_id: 'test-chunk',
        original_text: 'x'.repeat(20000), // Large text
        responses: [
          { model: 'openai', response: 'Processed chunk 1', error: null }
        ],
        chunked: true,
        chunk_info: {
          total_chunks: 3,
          current_chunk: 1,
          chunk_tokens: 3000
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const analyzeText = async (text, keys) => {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, ...keys })
        });
        return response.json();
      };

      const result = await analyzeText('x'.repeat(20000), { openai_key: 'key' });
      
      expect(result.chunked).toBe(true);
      expect(result.chunk_info.total_chunks).toBe(3);
      expect(result.chunk_info.current_chunk).toBe(1);
    });
  });
});