/**
 * Updated Workflow Execution Test
 * 
 * Tests the updated frontend workflow store that uses the new backend APIs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const BACKEND_URL = 'http://localhost:8000'

describe('Updated Workflow Execution', () => {
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

  it('should execute a valid workflow using backend validation', async () => {
    console.log('Testing updated workflow execution with backend validation...')
    
    const startTime = Date.now()
    const timeoutMs = 60000 // 60 second timeout
    
    try {
      // Import the workflow store
      const { useWorkflowStore } = await import('../../state/workflowStore')
      const { createNewWorkflow, addNode, executeWorkflow } = useWorkflowStore.getState()
      
      // Create a valid workflow
      console.log('Creating valid workflow...')
      createNewWorkflow('Test Valid Workflow', 'Testing backend validation')
      
      // Add input node
      addNode('input', { x: 100, y: 100 })
      
      // Add output node
      addNode('output', { x: 300, y: 100 })
      
      // Wait for nodes to be created, then get their IDs
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Get the created nodes and add edge
      const { nodes, onConnect } = useWorkflowStore.getState()
      const inputNode = nodes.find(n => n.type === 'input')
      const outputNode = nodes.find(n => n.type === 'output')
      
      if (inputNode && outputNode) {
        onConnect({
          source: inputNode.id,
          target: outputNode.id,
          sourceHandle: null,
          targetHandle: null
        })
      }
      
      // Wait a moment for nodes to be created
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Executing workflow with backend validation...')
      
      // Execute workflow with timeout
      const executionPromise = executeWorkflow()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout after 60 seconds')), timeoutMs)
      )
      
      const result: any = await Promise.race([executionPromise, timeoutPromise])
      
      const elapsed = Date.now() - startTime
      console.log(`Workflow execution completed in ${elapsed}ms`)
      
      if (elapsed > timeoutMs) {
        throw new Error(`Test timed out after ${timeoutMs}ms`)
      }
      
      console.log('Execution result:', result)
      
      // Check the result
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('results')
      expect(result.status).toBe('success')
      
      // Check execution state
      const { execution, isExecuting } = useWorkflowStore.getState()
      expect(isExecuting).toBe(false)
      expect(execution).toBeTruthy()
      expect(execution?.status).toBe('completed')
      
      console.log('✅ Updated workflow execution successful!')
      
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`Test failed after ${elapsed}ms:`, error)
      throw error
    }
  })

  it('should reject invalid workflow using backend validation', async () => {
    console.log('Testing invalid workflow rejection with backend validation...')
    
    const startTime = Date.now()
    const timeoutMs = 30000 // 30 second timeout
    
    try {
      // Import the workflow store
      const { useWorkflowStore } = await import('../../state/workflowStore')
      const { createNewWorkflow, addNode, executeWorkflow } = useWorkflowStore.getState()
      
      // Create an invalid workflow (no output node)
      console.log('Creating invalid workflow...')
      createNewWorkflow('Test Invalid Workflow', 'Testing backend validation rejection')
      
      // Add only input and LLM nodes (no output)
      addNode('input', { x: 100, y: 100 })
      addNode('llm', { x: 300, y: 100 })
      
      // Wait a moment for nodes to be created
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Attempting to execute invalid workflow...')
      
      // Execute workflow with timeout
      const executionPromise = executeWorkflow()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout after 30 seconds')), timeoutMs)
      )
      
      try {
        await Promise.race([executionPromise, timeoutPromise])
        throw new Error('Expected execution to fail but it succeeded')
      } catch (error: any) {
        const elapsed = Date.now() - startTime
        console.log(`Invalid workflow correctly rejected in ${elapsed}ms`)
        
        if (elapsed > timeoutMs) {
          throw new Error(`Test timed out after ${timeoutMs}ms`)
        }
        
        // Check that it's the expected validation error
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Workflow validation failed')
        expect(error.message).toContain('output node')
        
        // Check execution state
        const { isExecuting } = useWorkflowStore.getState()
        expect(isExecuting).toBe(false)
        
        console.log('✅ Invalid workflow correctly rejected by backend validation!')
      }
      
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`Test failed after ${elapsed}ms:`, error)
      throw error
    }
  })
}) 