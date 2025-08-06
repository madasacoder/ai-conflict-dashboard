/**
 * MSW Server Setup for Node.js Tests
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create the server instance with our handlers
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'bypass' // Allow real requests to pass through if needed
  })
})

// Reset any request handlers that are declared in tests
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests are done
afterAll(() => {
  server.close()
})