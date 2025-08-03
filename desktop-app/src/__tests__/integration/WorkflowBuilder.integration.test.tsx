import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from 'reactflow'
import App from '@/App'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock Tauri if it exists
if (typeof window !== 'undefined') {
  (window as any).__TAURI__ = {
    invoke: vi.fn()
  }
}

describe('WorkflowBuilder Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock successful health check
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy', version: '0.1.0', message: 'All systems operational' })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should load the app and show welcome screen', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Welcome to AI Conflict Dashboard Desktop')).toBeTruthy()
    })

    expect(screen.getByText('🚀 Launch Workflow Builder')).toBeTruthy()
  })

  it('should enable launch button when API is healthy', async () => {
    render(<App />)

    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    
    await waitFor(() => {
      expect(launchButton).not.toBeDisabled()
    })
  })

  it('should disable launch button when API is unhealthy', async () => {
    // Override the mock for this test
    (global.fetch as any).mockReset()
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'))

    render(<App />)

    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    
    await waitFor(() => {
      expect(launchButton).toBeDisabled()
    })
  })

  it('should open workflow builder when launch button is clicked', async () => {
    render(<App />)

    const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
    
    await waitFor(() => {
      expect(launchButton).not.toBeDisabled()
    })

    await userEvent.click(launchButton)

    // Should show workflow builder
    expect(screen.queryByText('Welcome to AI Conflict Dashboard Desktop')).not.toBeTruthy()
  })

  describe('Workflow Builder Functionality', () => {
    beforeEach(async () => {
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await waitFor(() => expect(launchButton).not.toBeDisabled())
      await userEvent.click(launchButton)
    })

    it('should show node palette', async () => {
      await waitFor(() => {
        expect(screen.getByText('Node Library')).toBeTruthy()
      })

      // Check all node types are visible
      expect(screen.getByText('Input')).toBeTruthy()
      expect(screen.getByText('AI Analysis')).toBeTruthy()
      expect(screen.getByText('Compare')).toBeTruthy()
      expect(screen.getByText('Summarize')).toBeTruthy()
      expect(screen.getByText('Output')).toBeTruthy()
    })

    it('should toggle palette visibility', async () => {
      const closeButton = screen.getByLabelText('Close palette')
      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Node Library')).not.toBeTruthy()
      })
    })

    it('should show workflow toolbar', async () => {
      // Look for toolbar buttons
      expect(screen.getByLabelText('Toggle palette')).toBeTruthy()
      expect(screen.getByLabelText('Toggle theme')).toBeTruthy()
    })

    it('should toggle theme', async () => {
      const themeButton = screen.getByLabelText('Toggle theme')
      const container = screen.getByTestId('workflow-builder') || document.querySelector('.workflow-builder')

      // Check initial theme
      expect(container?.className).toContain('light')

      await userEvent.click(themeButton)

      // Check theme changed
      expect(container?.className).toContain('dark')
    })

    it('should handle drag and drop simulation', async () => {
      // This is a simplified test since actual drag-drop is hard to simulate
      const inputNode = screen.getByText('Input').closest('.palette-node')
      expect(inputNode).toBeTruthy()
      
      // Check draggable attribute
      expect(inputNode?.getAttribute('draggable')).toBe('true')

      // Simulate drag start
      const dragStartEvent = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      })

      fireEvent(inputNode!, dragStartEvent)
    })
  })

  describe('Error Handling', () => {
    it('should show error toast on API connection failure', async () => {
      (global.fetch as any).mockReset()
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to connect to backend API/)).toBeTruthy()
      })
    })

    it('should show API status in welcome screen', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('API Status:')).toBeTruthy()
        expect(screen.getByText('healthy')).toBeTruthy()
      })
    })
  })

  describe('Full Workflow Creation', () => {
    beforeEach(async () => {
      render(<App />)
      
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await waitFor(() => expect(launchButton).not.toBeDisabled())
      await userEvent.click(launchButton)
    })

    it('should create a new workflow', async () => {
      // Click new workflow button (when implemented)
      // For now, just check the canvas is ready
      const canvas = document.querySelector('.workflow-canvas')
      expect(canvas).toBeTruthy()
    })

    it('should persist UI state', async () => {
      // Toggle theme
      const themeButton = screen.getByLabelText('Toggle theme')
      await userEvent.click(themeButton)

      // Reload the component
      const { unmount } = render(<App />)
      unmount()
      
      render(<App />)
      
      // Launch workflow builder again
      const launchButton = await screen.findByText('🚀 Launch Workflow Builder')
      await waitFor(() => expect(launchButton).not.toBeDisabled())
      await userEvent.click(launchButton)

      // Check theme persisted
      const container = document.querySelector('.workflow-builder')
      expect(container?.className).toContain('dark')
    })
  })
})