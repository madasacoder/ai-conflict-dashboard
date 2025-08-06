/**
 * Simple Workflow Execution Test
 * 
 * Focused test for core workflow execution functionality.
 * Tests the essential workflow execution without complex UI interactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

const BACKEND_URL = 'http://localhost:8000'

describe('Simple Workflow Execution', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Mock fetch to use the correct backend URL for tests
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      // Convert relative URLs to absolute backend URLs
      if (url.startsWith('/api/')) {
        url = `${BACKEND_URL}${url}`
      }
      return originalFetch(url, options)
    })
  })

  afterEach(() => {
    // Restore original fetch
    global.fetch = fetch
  })

  it('should execute a simple workflow with backend API', async () => {
    console.log('Starting simple workflow execution test...')
    
    render(<App />)
    
    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText(/Launch Workflow Builder|No Workflow/)).toBeInTheDocument()
    }, { timeout: 5000 })
    
    console.log('App loaded successfully')
    
    // Launch workflow builder if needed
    const launchButton = screen.queryByText('🚀 Launch Workflow Builder')
    if (launchButton) {
      console.log('Launching workflow builder...')
      await user.click(launchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      console.log('Workflow builder launched')
    }
    
    // Test direct workflow execution via store (bypassing UI)
    const { useWorkflowStore } = await import('../../state/workflowStore')
    const { createNewWorkflow, addNode, executeWorkflow } = useWorkflowStore.getState()
    
    console.log('Creating workflow...')
    createNewWorkflow('Simple Test Workflow', 'Testing basic execution')
    
    console.log('Adding input node...')
    addNode('input', { x: 100, y: 100 })
    
    console.log('Adding LLM node...')
    addNode('llm', { x: 300, y: 100 })
    
    // Wait a moment for nodes to be created
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Executing workflow...')
    
    // Execute workflow with timeout
    const executionPromise = executeWorkflow()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Execution timeout after 30 seconds')), 30000)
    )
    
    try {
      await Promise.race([executionPromise, timeoutPromise])
      console.log('Workflow execution completed successfully')
      
      // Check execution state
      const { execution, isExecuting } = useWorkflowStore.getState()
      console.log('Execution state:', { isExecuting, hasResults: !!execution })
      
      expect(isExecuting).toBe(false)
      expect(execution).toBeTruthy()
      
    } catch (error) {
      console.error('Workflow execution failed:', error)
      throw error
    }
  }, 35000) // 35 second timeout for the entire test
}) 