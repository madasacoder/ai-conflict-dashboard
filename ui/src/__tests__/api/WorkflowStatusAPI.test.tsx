/**
 * Workflow Status API Test
 * 
 * Tests the workflow status and stop API endpoints with timeout monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const BACKEND_URL = 'http://localhost:8000'

describe('Workflow Status API', () => {
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

  it('should get workflow status for non-existent workflow', async () => {
    console.log('Testing workflow status for non-existent workflow...')
    
    const startTime = Date.now()
    const timeoutMs = 30000 // 30 second timeout
    
    try {
      const response = await fetch('/api/workflows/nonexistent-123/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const elapsed = Date.now() - startTime
      console.log(`Status API call completed in ${elapsed}ms`)
      
      if (elapsed > timeoutMs) {
        throw new Error(`Test timed out after ${timeoutMs}ms`)
      }
      
      console.log('Status API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Status API Response:', result)
        
        expect(response.status).toBe(200)
        expect(result).toHaveProperty('workflow_id')
        expect(result).toHaveProperty('status')
        expect(result.workflow_id).toBe('nonexistent-123')
        expect(result.status).toBe('not_found')
        
        console.log('✅ Status API test successful!')
      } else {
        const errorText = await response.text()
        console.error('Status API Error:', errorText)
        throw new Error(`Status API call failed: ${response.status} ${errorText}`)
      }
      
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`Test failed after ${elapsed}ms:`, error)
      throw error
    }
  })

  it('should stop non-existent workflow', async () => {
    console.log('Testing stop workflow for non-existent workflow...')
    
    const startTime = Date.now()
    const timeoutMs = 30000 // 30 second timeout
    
    try {
      const response = await fetch('/api/workflows/nonexistent-456/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const elapsed = Date.now() - startTime
      console.log(`Stop API call completed in ${elapsed}ms`)
      
      if (elapsed > timeoutMs) {
        throw new Error(`Test timed out after ${timeoutMs}ms`)
      }
      
      console.log('Stop API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Stop API Response:', result)
        
        expect(response.status).toBe(200)
        expect(result).toHaveProperty('workflow_id')
        expect(result).toHaveProperty('status')
        expect(result.workflow_id).toBe('nonexistent-456')
        expect(result.status).toBe('not_found')
        
        console.log('✅ Stop API test successful!')
      } else {
        const errorText = await response.text()
        console.error('Stop API Error:', errorText)
        throw new Error(`Stop API call failed: ${response.status} ${errorText}`)
      }
      
    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`Test failed after ${elapsed}ms:`, error)
      throw error
    }
  })
}) 