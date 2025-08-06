import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { useWorkflowStore } from '../../state/workflowStore'

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn())

// Helper to create a spec-compliant Response object
const createMockResponse = (body: any, status: number) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

describe('Desktop App - Translation Pipeline E2E', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(input.toString(), 'http://localhost')

      if (url.pathname === '/api/health') {
        return Promise.resolve(createMockResponse({ status: 'healthy', message: 'API is running' }, 200))
      }
      if (url.pathname === '/api/workflows/validate') {
        return Promise.resolve(createMockResponse({ valid: true }, 200))
      }
      if (url.pathname === '/api/workflows/execute') {
        return Promise.resolve(createMockResponse({
          status: 'completed',
          results: [
            {
              nodeId: 'output_node_1',
              success: true,
              data: {
                translatedText: 'Hola mundo',
                model: 'gpt-4',
                confidence: 0.95
              }
            }
          ]
        }, 200))
      }
      return Promise.resolve(createMockResponse({ error: `Not Found: ${url.pathname}` }, 404))
    })
  })

  it('should execute translation workflow and display results', async () => {
    const user = userEvent.setup()
    
    render(<App />)
    
    // Launch workflow builder
    await waitFor(() => {
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      expect(launchButton).toBeInTheDocument()
      expect(launchButton).not.toBeDisabled()
    })
    
    await act(async () => {
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
    })
    
    // Create a workflow
    await act(async () => {
      useWorkflowStore.getState().createNewWorkflow('Translation Workflow')
    })

    // Get the workflow store and create nodes
    const { addNode, onNodesChange } = useWorkflowStore.getState()
    
    await act(async () => {
      addNode('input', { x: 100, y: 100 })
      addNode('llm', { x: 300, y: 100 })
      const outputNode = { id: 'output_node_1', type: 'output' as const, position: { x: 500, y: 100 }, data: { label: 'Output', format: 'json', isConfigured: true, includeMetadata: false, description: 'Output node' } }
      onNodesChange([{ type: 'add', item: outputNode }])
    })
    
    // Click execute button
    const executeButton = screen.getByTestId('execute-workflow')
    await act(async () => {
      await user.click(executeButton)
    })
    
    // Verify execution results
    await waitFor(() => {
      expect(screen.getByText('Translation Results')).toBeInTheDocument()
    }, { timeout: 10000 })
    
    expect(screen.getByText('Hola mundo')).toBeInTheDocument()
    expect(screen.getByText('gpt-4')).toBeInTheDocument()
    expect(screen.getByText('95% Confidence')).toBeInTheDocument()
  }, 15000)
})
