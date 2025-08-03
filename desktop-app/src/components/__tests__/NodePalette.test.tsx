import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodePalette } from '../ui/NodePalette'
import { useWorkflowStore } from '@/state/workflowStore'

// Mock the store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Brain: () => <span>Brain Icon</span>,
  Type: () => <span>Type Icon</span>,
  Download: () => <span>Download Icon</span>,
  GitCompare: () => <span>GitCompare Icon</span>,
  FileText: () => <span>FileText Icon</span>,
  X: () => <span>X Icon</span>
}))

describe('NodePalette Component', () => {
  const mockTogglePalette = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useWorkflowStore as any).mockReturnValue({
      togglePalette: mockTogglePalette
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render all node types', () => {
    render(<NodePalette />)

    // Check all node types are rendered
    expect(screen.getByText('Input')).toBeTruthy()
    expect(screen.getByText('AI Analysis')).toBeTruthy()
    expect(screen.getByText('Compare')).toBeTruthy()
    expect(screen.getByText('Summarize')).toBeTruthy()
    expect(screen.getByText('Output')).toBeTruthy()
  })

  it('should render all categories', () => {
    render(<NodePalette />)

    expect(screen.getByText('Sources')).toBeTruthy()
    expect(screen.getByText('Processing')).toBeTruthy()
    expect(screen.getByText('Outputs')).toBeTruthy()
  })

  it('should set drag data on drag start', () => {
    render(<NodePalette />)

    const inputNode = screen.getByText('Input').closest('.palette-node')
    expect(inputNode).toBeTruthy()

    const mockDataTransfer = {
      setData: vi.fn(),
      effectAllowed: ''
    }

    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: mockDataTransfer
    })

    fireEvent(inputNode!, dragStartEvent)

    // Check that both data types were set
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('application/reactflow', 'input')
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', 'input')
    expect(mockDataTransfer.effectAllowed).toBe('move')
  })

  it('should call togglePalette when close button is clicked', () => {
    render(<NodePalette />)

    const closeButton = screen.getByLabelText('Close palette')
    fireEvent.click(closeButton)

    expect(mockTogglePalette).toHaveBeenCalled()
  })

  it('should have draggable attribute on all nodes', () => {
    const { container } = render(<NodePalette />)

    // Get all palette nodes by test id
    const paletteNodes = container.querySelectorAll('[data-testid^="node-palette-"]')
    
    expect(paletteNodes.length).toBeGreaterThan(0)
    
    paletteNodes.forEach(node => {
      // Check that the node has draggable attribute
      const draggableAttr = node.getAttribute('draggable')
      expect(draggableAttr === 'true' || draggableAttr === '').toBe(true)
    })
  })

  it('should apply custom color styles to nodes', () => {
    const { container } = render(<NodePalette />)

    const inputNode = screen.getByText('Input').closest('.palette-node')
    expect(inputNode?.getAttribute('style')).toContain('--node-color: #3498db')

    const aiNode = screen.getByText('AI Analysis').closest('.palette-node')
    expect(aiNode?.getAttribute('style')).toContain('--node-color: #e74c3c')
  })

  it('should display node descriptions', () => {
    render(<NodePalette />)

    expect(screen.getByText('Text, file, or URL input')).toBeTruthy()
    expect(screen.getByText('Multi-model AI analysis')).toBeTruthy()
    expect(screen.getByText('Find conflicts & consensus')).toBeTruthy()
    expect(screen.getByText('Consolidate results')).toBeTruthy()
    expect(screen.getByText('Export results')).toBeTruthy()
  })

  it('should display drag hint', () => {
    render(<NodePalette />)

    expect(screen.getByText('💡 Drag nodes to the canvas to build your workflow')).toBeTruthy()
  })

  it('should trigger drag start for all node types', () => {
    render(<NodePalette />)

    const nodeTypes = ['input', 'llm', 'compare', 'summarize', 'output']
    const nodeLabels = ['Input', 'AI Analysis', 'Compare', 'Summarize', 'Output']

    nodeLabels.forEach((label, index) => {
      const node = screen.getByText(label).closest('.palette-node')
      
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: ''
      }

      const dragStartEvent = new Event('dragstart', { bubbles: true }) as any
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: mockDataTransfer
      })

      fireEvent(node!, dragStartEvent)

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('application/reactflow', nodeTypes[index])
    })
  })
})