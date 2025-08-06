import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock fetch
beforeEach(() => {
  global.fetch = vi.fn()
})

describe('App', () => {
  it('renders welcome message', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy', message: 'All systems operational' }),
    })

    render(<App />)
    
    // Check for welcome text
    expect(await screen.findByText(/Welcome to AI Conflict Dashboard Desktop/i)).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    // Mock pending API response
    global.fetch.mockImplementationOnce(() => new Promise(() => {}))

    render(<App />)
    
    expect(screen.getByText(/Initializing AI Conflict Dashboard.../i)).toBeInTheDocument()
  })
})