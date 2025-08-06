/**
 * Workflow Validation API Test
 * 
 * Tests the workflow validation API endpoint to ensure it correctly validates workflows.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const BACKEND_URL = 'http://localhost:8000'

describe('Workflow Validation API', () => {
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

  it('should validate a valid workflow successfully', async () => {
    console.log('Testing valid workflow validation...')
    
    // Valid workflow with input -> output
    const validWorkflow = {
      workflow: {
        nodes: [
          {
            id: 'input1',
            type: 'input',
            data: { text: 'Hello world' }
          },
          {
            id: 'output1',
            type: 'output',
            data: { format: 'text' }
          }
        ],
        edges: [
          {
            id: 'edge1',
            source: 'input1',
            target: 'output1'
          }
        ]
      }
    }
    
    try {
      const response = await fetch('/api/workflows/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validWorkflow)
      })
      
      console.log('Validation API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Validation API Response:', result)
        
        expect(response.status).toBe(200)
        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
        expect(result.output_node_count).toBe(1)
        
        console.log('✅ Valid workflow validation successful!')
      } else {
        const errorText = await response.text()
        console.error('Validation API Error:', errorText)
        throw new Error(`Validation API call failed: ${response.status} ${errorText}`)
      }
      
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })

  it('should reject an invalid workflow with missing output node', async () => {
    console.log('Testing invalid workflow validation (missing output)...')
    
    // Invalid workflow - no output node
    const invalidWorkflow = {
      workflow: {
        nodes: [
          {
            id: 'input1',
            type: 'input',
            data: { text: 'Hello world' }
          },
          {
            id: 'llm1',
            type: 'llm',
            data: { prompt: 'Translate: {input}' }
          }
        ],
        edges: [
          {
            id: 'edge1',
            source: 'input1',
            target: 'llm1'
          }
        ]
      }
    }
    
    try {
      const response = await fetch('/api/workflows/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidWorkflow)
      })
      
      console.log('Invalid workflow validation response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Invalid workflow validation response:', result)
        
        expect(response.status).toBe(200)
        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Workflow must have at least one output node')
        expect(result.output_node_count).toBe(0)
        
        console.log('✅ Invalid workflow correctly rejected!')
      } else {
        const errorText = await response.text()
        console.error('Validation API Error:', errorText)
        throw new Error(`Validation API call failed: ${response.status} ${errorText}`)
      }
      
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })
}) 