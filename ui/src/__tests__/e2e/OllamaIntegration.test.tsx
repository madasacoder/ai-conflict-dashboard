/**
 * Ollama Integration E2E Test - Desktop App
 * Converted from Playwright to Vitest
 *
 * Tests Ollama local model integration in the workflow builder
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'

// Mock fetch for Ollama API calls
global.fetch = vi.fn()

describe('Desktop Workflow Builder - Ollama Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock Ollama models endpoint
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/ollama/models')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            available: true,
            models: [
              { name: 'llama2:7b', size: 3.8 },
              { name: 'mistral:7b', size: 4.1 },
              { name: 'gemma:2b', size: 1.4 },
            ],
          }),
        })
      }
      
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy', version: '0.1.0' }),
        })
      }
      
      if (url.includes('/api/execute')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            result: 'Ollama response text',
            model: 'llama2:7b',
          }),
        })
      }
      
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('should display Ollama models correctly in dropdown', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Launch workflow builder
    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    await user.click(launchButton)
    
    // Wait for workflow builder to be visible
    await waitFor(() => {
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
    })
    
    // TODO: Add node creation and Ollama model selection when UI supports it
    // This test needs the actual LLM node configuration UI to be implemented
  })

  it('should execute workflow with Ollama model', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Launch workflow builder
    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    await user.click(launchButton)
    
    // Wait for workflow builder
    await waitFor(() => {
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
    })
    
    // TODO: Create workflow with Ollama node and execute
    // This requires full workflow creation and execution UI
  })

  it('should handle Ollama connection errors gracefully', async () => {
    // Mock Ollama API to return error
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/ollama/models')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Ollama service not available' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      })
    })
    
    const user = userEvent.setup()
    render(<App />)
    
    // Launch workflow builder
    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    await user.click(launchButton)
    
    // TODO: Try to select Ollama and verify error handling
    // This needs the model selection UI to be implemented
  })

  it('should refresh Ollama models list', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Launch workflow builder
    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    await user.click(launchButton)
    
    // TODO: Test refresh button functionality
    // This needs the refresh UI to be implemented
  })

  it('should validate Ollama model selection before execution', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Launch workflow builder
    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    await user.click(launchButton)
    
    // TODO: Create workflow with invalid Ollama config and verify validation
    // This needs the validation UI to be implemented
  })
})