/**
 * NodeConfigPanel Component Tests
 * 
 * Tests for the main node configuration panel including
 * rendering, node selection, and configuration updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeConfigPanel } from '../NodeConfigPanel'
import { useWorkflowStore } from '@/state/workflowStore'
import { Node } from '@/types/workflow'

// Mock the workflow store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock CSS imports
vi.mock('../NodeConfigPanel.css', () => ({}))
vi.mock('../NodeConfigs/InputNodeConfig', () => ({
  InputNodeConfig: ({ node, onUpdate }: any) => (
    <div data-testid="input-node-config">
      <h3>Input Node Config</h3>
      <button onClick={() => onUpdate('label', 'Updated Label')}>
        Update Label
      </button>
    </div>
  )
}))

vi.mock('../NodeConfigs/LLMNodeConfig', () => ({
  LLMNodeConfig: ({ node, onUpdate }: any) => (
    <div data-testid="llm-node-config">
      <h3>LLM Node Config</h3>
      <button onClick={() => onUpdate('models', ['gpt-4'])}>
        Update Models
      </button>
    </div>
  )
}))

vi.mock('../NodeConfigs/CompareNodeConfig', () => ({
  CompareNodeConfig: ({ node, onUpdate }: any) => (
    <div data-testid="compare-node-config">
      <h3>Compare Node Config</h3>
      <button onClick={() => onUpdate('comparisonType', 'consensus')}>
        Update Comparison Type
      </button>
    </div>
  )
}))

vi.mock('../NodeConfigs/OutputNodeConfig', () => ({
  OutputNodeConfig: ({ node, onUpdate }: any) => (
    <div data-testid="output-node-config">
      <h3>Output Node Config</h3>
      <button onClick={() => onUpdate('outputFormat', 'json')}>
        Update Format
      </button>
    </div>
  )
}))

const mockWorkflowStore = {
  selectedNode: null,
  setSelectedNode: vi.fn(),
  updateNodeData: vi.fn()
}

const mockInputNode: Node = {
  id: 'input-1',
  type: 'input',
  position: { x: 0, y: 0 },
  data: {
    label: 'Input Node',
    icon: '📝',
    color: '#3498db',
    inputType: 'text',
    placeholder: 'Enter text...'
  }
}

const mockLLMNode: Node = {
  id: 'llm-1',
  type: 'llm',
  position: { x: 100, y: 0 },
  data: {
    label: 'LLM Node',
    icon: '🤖',
    color: '#e74c3c',
    models: ['gpt-4'],
    prompt: 'Analyze the following:\n\n{input}'
  }
}

describe('NodeConfigPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useWorkflowStore as any).mockReturnValue(mockWorkflowStore)
  })

  describe('Rendering', () => {
    it('should not render when no node is selected', () => {
      render(<NodeConfigPanel />)
      
      expect(screen.queryByText('Node Configuration')).not.toBeInTheDocument()
    })

    it('should render when a node is selected', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByText('Node Configuration')).toBeInTheDocument()
      expect(screen.getByText('input Node')).toBeInTheDocument()
    })

    it('should show node icon and color', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      const nodeIcon = document.querySelector('.node-icon')
      expect(nodeIcon).toHaveTextContent('📝')
      expect(nodeIcon).toHaveStyle('background-color: #3498db')
    })
  })

  describe('Node Type Specific Forms', () => {
    it('should render InputNodeConfig for input nodes', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByTestId('input-node-config')).toBeInTheDocument()
      expect(screen.getByText('Input Node Config')).toBeInTheDocument()
    })

    it('should render LLMNodeConfig for llm nodes', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockLLMNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByTestId('llm-node-config')).toBeInTheDocument()
      expect(screen.getByText('LLM Node Config')).toBeInTheDocument()
    })

    it('should render CompareNodeConfig for compare nodes', () => {
      const compareNode: Node = {
        id: 'compare-1',
        type: 'compare',
        position: { x: 200, y: 0 },
        data: { label: 'Compare Node', comparisonType: 'conflicts' }
      }

      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: compareNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByTestId('compare-node-config')).toBeInTheDocument()
      expect(screen.getByText('Compare Node Config')).toBeInTheDocument()
    })

    it('should render OutputNodeConfig for output nodes', () => {
      const outputNode: Node = {
        id: 'output-1',
        type: 'output',
        position: { x: 300, y: 0 },
        data: { label: 'Output Node', outputFormat: 'markdown' }
      }

      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: outputNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByTestId('output-node-config')).toBeInTheDocument()
      expect(screen.getByText('Output Node Config')).toBeInTheDocument()
    })

    it('should show fallback message for unsupported node types', () => {
      const unsupportedNode: Node = {
        id: 'unknown-1',
        type: 'unknown' as any,
        position: { x: 400, y: 0 },
        data: { label: 'Unknown Node' }
      }

      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: unsupportedNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByText('Configuration not available for this node type.')).toBeInTheDocument()
    })
  })

  describe('Panel Interactions', () => {
    it('should close panel when close button is clicked', async () => {
      const user = userEvent.setup()
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      const closeBtn = screen.getByLabelText('Close configuration panel')
      await user.click(closeBtn)
      
      expect(mockWorkflowStore.setSelectedNode).toHaveBeenCalledWith(null)
    })

    it('should handle overlay click to close panel', async () => {
      const user = userEvent.setup()
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      const overlay = document.querySelector('.node-config-overlay')
      await user.click(overlay!)
      
      expect(mockWorkflowStore.setSelectedNode).toHaveBeenCalledWith(null)
    })

    it('should not close when clicking on panel content', async () => {
      const user = userEvent.setup()
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      const panel = document.querySelector('.node-config-panel')
      await user.click(panel!)
      
      expect(mockWorkflowStore.setSelectedNode).not.toHaveBeenCalled()
    })
  })

  describe('Configuration Updates', () => {
    it('should call updateNodeData when form updates are made', async () => {
      const user = userEvent.setup()
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      const updateButton = screen.getByText('Update Label')
      await user.click(updateButton)
      
      expect(mockWorkflowStore.updateNodeData).toHaveBeenCalledWith(
        'input-1',
        'label',
        'Updated Label'
      )
    })

    it('should handle updates for different node types', async () => {
      const user = userEvent.setup()
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockLLMNode
      })

      render(<NodeConfigPanel />)
      
      const updateButton = screen.getByText('Update Models')
      await user.click(updateButton)
      
      expect(mockWorkflowStore.updateNodeData).toHaveBeenCalledWith(
        'llm-1',
        'models',
        ['gpt-4']
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByLabelText('Close configuration panel')).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      (useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        selectedNode: mockInputNode
      })

      render(<NodeConfigPanel />)
      
      expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Node Configuration')
    })
  })
})