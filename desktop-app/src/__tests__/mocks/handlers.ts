/**
 * MSW Request Handlers
 * 
 * Intercepts all API calls at the network level for consistent test behavior
 */

import { http, HttpResponse } from 'msw'

export const handlers = [
  // Health check endpoint
  http.get('http://localhost:8000/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '0.1.0'
    })
  }),

  // Workflow execution endpoint
  http.post('http://localhost:8000/api/workflows/:id/execute', async ({ request, params }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: params.id,
      status: 'completed',
      result: 'Mocked execution result',
      nodes: body.nodes || [],
      timestamp: new Date().toISOString()
    })
  }),

  // Save workflow endpoint
  http.put('http://localhost:8000/api/workflows/:id', async ({ request, params }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: params.id,
      saved: true,
      workflow: body.workflow,
      timestamp: new Date().toISOString()
    })
  }),

  // Load workflow endpoint
  http.get('http://localhost:8000/api/workflows/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Workflow',
      nodes: [],
      edges: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    })
  }),

  // Ollama models endpoint
  http.get('http://localhost:8000/api/ollama/models', () => {
    return HttpResponse.json({
      available: true,
      models: [
        { name: 'llama2:7b', size: 3.8 },
        { name: 'mistral:7b', size: 4.1 },
        { name: 'gemma:2b', size: 1.4 }
      ]
    })
  }),

  // Analyze endpoint
  http.post('http://localhost:8000/api/analyze', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      result: `Analysis result for: ${body.text || 'unknown'}`,
      model: body.model || 'gpt-4',
      timestamp: new Date().toISOString()
    })
  })
]