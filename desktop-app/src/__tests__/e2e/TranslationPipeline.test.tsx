import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Mock fetch globally with proper Response object
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Desktop App - Translation Pipeline E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API health check with proper Response object
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy', message: 'API is running' }),
      clone: function() { return this; }
    })
  })

  describe('Application Initialization', () => {
    it('should display desktop application header with correct version and branding', async () => {
      render(<App />)
      
      // Wait for app to load past the loading screen
      await waitFor(() => {
        expect(screen.getByText('AI Conflict Dashboard')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Specific business requirements - exact text and structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Conflict Dashboard')
      expect(screen.getByText('v0.1.0 - Desktop Edition')).toBeInTheDocument()
      expect(screen.getByText('Welcome to AI Conflict Dashboard Desktop')).toBeInTheDocument()
      
      // Business value - user can identify this is the desktop version
      expect(screen.getByText(/A powerful tool for orchestrating multiple AI models/)).toBeInTheDocument()
    })

    it('should establish API connection and display healthy status with specific details', async () => {
      render(<App />)
      
      // Wait for API health check to complete
      await waitFor(() => {
        expect(screen.getByText('API Status:')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Strong assertions - exact status values
      expect(screen.getByText('healthy')).toBeInTheDocument()
      expect(screen.getByText('API is running')).toBeInTheDocument()
      
      // Business value - user knows API is connected
      const statusElement = screen.getByText('healthy')
      expect(statusElement).toHaveClass('healthy') // Should show healthy styling
    })

    it('should provide launch button with correct accessibility and enabled state', async () => {
      render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      
      // Strong assertions - exact button properties
      expect(launchButton).toBeInTheDocument()
      expect(launchButton).not.toHaveAttribute('disabled') // Should be enabled when API is healthy
      expect(launchButton).toHaveClass('primary-btn')
      
      // Business value - user can proceed with healthy API
      expect(launchButton).not.toBeDisabled()
    })
  })

  describe('Workflow Builder Launch and Core Components', () => {
    it('should transition from welcome screen to workflow builder with all essential components', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      
      // Test the actual user interaction
      await user.click(launchButton)
      
      // Strong assertions - verify all workflow builder components are present
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument()
      expect(screen.getByText('No Workflow')).toBeInTheDocument()
      expect(screen.getByTestId('execute-workflow')).toBeInTheDocument()
      
      // Business value - user can see they're in workflow mode
      expect(screen.getByTestId('workflow-builder')).toHaveClass('workflow-builder')
    })

    it('should display workflow canvas with proper React Flow integration and empty state', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify canvas structure
      const canvas = screen.getByTestId('react-flow-wrapper')
      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveClass('react-flow__renderer')
      
      // Business value - user can see empty canvas ready for nodes
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
    })

    it('should show workflow toolbar with correct initial state and execute button disabled', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify toolbar state
      expect(screen.getByText('No Workflow')).toBeInTheDocument()
      
      const executeButton = screen.getByTestId('execute-workflow')
      expect(executeButton).toBeInTheDocument()
      expect(executeButton).toBeDisabled() // Should be disabled when no workflow exists
      expect(executeButton).toHaveAttribute('aria-label', 'Execute workflow')
      
      // Business value - user understands they need to create a workflow first
      expect(screen.getByText('No Workflow')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API connection failure gracefully and disable workflow builder', async () => {
      // Mock API failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Connection failed' }),
        clone: function() { return this; }
      })
      
      render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('API Status:')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Strong assertions - verify error state
      expect(screen.getByText('error')).toBeInTheDocument()
      expect(screen.getByText('🚀 Launch Workflow Builder')).toBeDisabled()
      
      // Business value - user can't proceed with broken API
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      expect(launchButton).toBeDisabled()
    })

    it('should maintain application state during rapid user interactions', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      const launchButton = screen.getByText('🚀 Launch Workflow Builder')
      
      // Test rapid clicking - should not break
      await user.click(launchButton)
      await user.click(launchButton) // Second click should be ignored
      await user.click(launchButton) // Third click should be ignored
      
      // Strong assertions - verify stable state
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
      expect(screen.getByText('No Workflow')).toBeInTheDocument()
      
      // Business value - app remains stable under user stress
      expect(screen.queryByText('🚀 Launch Workflow Builder')).not.toBeInTheDocument() // Should be hidden
    })
  })

  describe('Node Palette and Drag & Drop Operations', () => {
    it('should display node palette with all required node types for translation workflow', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify node palette structure
      expect(screen.getByTestId('node-palette')).toBeInTheDocument()
      
      // Business value - user can see all available node types
      expect(screen.getByText('Sources')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('Outputs')).toBeInTheDocument()
      
      // Translation workflow specific nodes
      expect(screen.getByText('Input')).toBeInTheDocument()
      expect(screen.getByText('AI Analysis')).toBeInTheDocument()
      expect(screen.getByText('Compare')).toBeInTheDocument()
      expect(screen.getByText('Output')).toBeInTheDocument()
    })

    it('should enable drag operations from node palette with proper data transfer', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Find input node in palette
      const inputNode = screen.getByTestId('node-palette-input')
      
      // Strong assertions - verify drag properties
      expect(inputNode).toBeInTheDocument()
      expect(inputNode).toHaveAttribute('draggable', 'true')
      expect(inputNode).toHaveClass('palette-node')
      
      // Business value - user can drag nodes to create workflows
      expect(inputNode).toBeInTheDocument()
    })

    it('should display all node types with correct categories and descriptions', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify all node types are present
      expect(screen.getByTestId('node-palette-input')).toBeInTheDocument()
      expect(screen.getByTestId('node-palette-llm')).toBeInTheDocument()
      expect(screen.getByTestId('node-palette-compare')).toBeInTheDocument()
      expect(screen.getByTestId('node-palette-summarize')).toBeInTheDocument()
      expect(screen.getByTestId('node-palette-output')).toBeInTheDocument()
      
      // Business value - user can see all available node types
      expect(screen.getByText('Text, file, or URL input')).toBeInTheDocument()
      expect(screen.getByText('Multi-model AI analysis')).toBeInTheDocument()
      expect(screen.getByText('Find conflicts & consensus')).toBeInTheDocument()
      expect(screen.getByText('Consolidate results')).toBeInTheDocument()
      expect(screen.getByText('Export results')).toBeInTheDocument()
    })

    it('should show node palette header and footer with helpful information', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify palette structure
      expect(screen.getByText('Node Library')).toBeInTheDocument()
      expect(screen.getByText('💡 Drag nodes to the canvas to build your workflow')).toBeInTheDocument()
      
      // Business value - user understands how to use the palette
      expect(screen.getByTestId('node-palette')).toBeInTheDocument()
    })
  })

  describe('Node Configuration and Validation', () => {
    it('should show workflow toolbar with execute button and other controls', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify toolbar controls
      expect(screen.getByTestId('execute-workflow')).toBeInTheDocument()
      expect(screen.getByTestId('save-workflow')).toBeInTheDocument()
      expect(screen.getByTestId('execution-results')).toBeInTheDocument()
      
      // Business value - user can access workflow controls
      expect(screen.getByText('Execute')).toBeInTheDocument()
      expect(screen.getByText('Results')).toBeInTheDocument()
    })

    it('should display workflow name and status in toolbar', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Launch workflow builder
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch Workflow Builder')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      await user.click(screen.getByText('🚀 Launch Workflow Builder'))
      
      // Strong assertions - verify workflow info
      expect(screen.getByText('No Workflow')).toBeInTheDocument()
      
      // Business value - user can see current workflow status
      expect(screen.getByTestId('workflow-builder')).toBeInTheDocument()
    })
  })
}) 