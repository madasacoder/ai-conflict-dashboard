/**
 * Workflow Execution API Test
 * 
 * Tests the workflow execution API endpoint to ensure it's working correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const BACKEND_URL = 'http://localhost:8000'

describe('Workflow Execution API', () => {
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

  it('should call the correct workflow execution API endpoint', async () => {
    console.log('Testing workflow execution API endpoint...')
    
    // Test data
    const testWorkflow = {
      workflow: {
        nodes: [
          {
            id: 'input1',
            type: 'input',
            data: { text: 'Hello world' }
          }
        ],
        edges: []
      },
      api_keys: {}
    }
    
    try {
      // Call the API directly
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testWorkflow)
      })
      
      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result)
        
        expect(response.status).toBe(200)
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('results')
        expect(result.status).toBe('success')
        
        console.log('✅ API call successful!')
      } else {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`API call failed: ${response.status} ${errorText}`)
      }
      
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })
}) 