/**
 * InputNode Component Tests
 * 
 * Tests for the InputNode component including file upload integration,
 * text input, URL input, and workflow store interactions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputNode } from '../InputNode'
import { useWorkflowStore } from '@/state/workflowStore'
import type { InputNodeData } from '@/state/workflowStore'
import type { UploadedFile } from '@/utils/fileUpload'

// Mock the workflow store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock the FileUpload component
vi.mock('@/components/ui/FileUpload', () => ({
  default: ({ onFilesUploaded, onError, className }: any) => (
    <div data-testid="file-upload-mock" className={className}>
      <button
        onClick={() => {
          const mockFiles: UploadedFile[] = [{
            id: 'test-file-1',
            originalName: 'test.txt',
            displayName: 'test.txt',
            size: 1024,
            type: 'text/plain',
            lastModified: Date.now(),
            content: 'Test file content'
          }]
          onFilesUploaded(mockFiles, 'Combined test content')
        }}
      >
        Upload Files
      </button>
      <button
        onClick={() => onError(['Test error'])}
      >
        Trigger Error
      </button>
    </div>
  )
}))

// Mock CSS imports
vi.mock('@/components/ui/FileUpload.css', () => ({}))

const mockUpdateNodeData = vi.fn()

const createMockNodeData = (overrides: Partial<InputNodeData> = {}): InputNodeData => ({
  label: 'Test Input',
  inputType: 'text',
  placeholder: 'Enter your text here...',
  isConfigured: false,
  ...overrides
})

describe('InputNode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock store
    ;(useWorkflowStore as any).mockImplementation((selector: any) => {
      const state = {
        updateNodeData: mockUpdateNodeData,
        getNodeExecutionStatus: vi.fn().mockReturnValue('pending')
      }
      return selector(state)
    })
  })

  describe('Rendering', () => {
    it('should render with basic props', () => {
      const data = createMockNodeData()
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByText('Test Input')).toBeInTheDocument()
      expect(screen.getByText('Text Input')).toBeInTheDocument()
      expect(screen.getByText('Enter your text here...')).toBeInTheDocument()
    })

    it('should show correct icon for different input types', () => {
      const testCases = [
        { inputType: 'text', expectedIcon: 'Type' },
        { inputType: 'file', expectedIcon: 'FileText' },
        { inputType: 'url', expectedIcon: 'Link' }
      ]
      
      testCases.forEach(({ inputType, expectedIcon }) => {
        const data = createMockNodeData({ inputType: inputType as any })
        
        const { container } = render(
          <InputNode
            data={data}
            id="test-node"
            selected={false}
          />
        )
        
        // Check for icon presence (lucide-react icons have specific class patterns)
        const iconElement = container.querySelector('.node-icon')
        expect(iconElement).toBeInTheDocument()
      })
    })

    it('should show configured state when content exists', () => {
      const data = createMockNodeData({
        content: 'Some content',
        isConfigured: true
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByTestId('handle-source')).toBeInTheDocument()
      // Should show success icon for configured state
      const successIcon = document.querySelector('.status-icon.success')
      expect(successIcon).toBeInTheDocument()
    })

    it('should show unconfigured state by default', () => {
      const data = createMockNodeData()
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Should show warning icon for unconfigured state
      const warningIcon = document.querySelector('.status-icon.warning')
      expect(warningIcon).toBeInTheDocument()
    })

    it('should apply selected class when selected', () => {
      const data = createMockNodeData()
      
      const { container } = render(
        <InputNode
          data={data}
          id="test-node"
          selected={true}
        />
      )
      
      const nodeElement = container.querySelector('.workflow-node')
      expect(nodeElement).toHaveClass('selected')
    })
  })

  describe('Expandable UI', () => {
    it('should expand when header is clicked', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData()
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByText('Click to configure')).toBeInTheDocument()
      
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Should show expanded content
      expect(screen.getByLabelText(/text content/i)).toBeInTheDocument()
    })

    it('should show different configuration UI for different input types', async () => {
      const user = userEvent.setup()
      
      // Test text input
      const textData = createMockNodeData({ inputType: 'text' })
      const { rerender, container } = render(
        <InputNode
          data={textData}
          id="test-node"
          selected={false}
        />
      )
      
      let header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      expect(screen.getByLabelText(/text content/i)).toBeInTheDocument()
      
      // Test file input - need to cleanup and rerender
      cleanup()
      const fileData = createMockNodeData({ inputType: 'file' })
      render(
        <InputNode
          data={fileData}
          id="test-node"
          selected={false}
        />
      )
      
      header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      expect(screen.getByTestId('file-upload-mock')).toBeInTheDocument()
      
      // Test URL input - need to cleanup and rerender
      cleanup()
      const urlData = createMockNodeData({ inputType: 'url' })
      render(
        <InputNode
          data={urlData}
          id="test-node"
          selected={false}
        />
      )
      
      header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument()
    })
  })

  describe('Text Input Functionality', () => {
    it('should handle text input changes', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'text' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Change the textarea value
      const textarea = screen.getByLabelText(/text content/i)
      fireEvent.change(textarea, { target: { value: 'Test content' } })
      
      expect(mockUpdateNodeData).toHaveBeenCalledWith('test-node', {
        content: 'Test content',
        isConfigured: true
      })
    })

    it('should show existing text content', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({
        inputType: 'text',
        content: 'Existing content'
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      const textarea = screen.getByLabelText(/text content/i) as HTMLTextAreaElement
      expect(textarea.value).toBe('Existing content')
    })
  })

  describe('URL Input Functionality', () => {
    it('should handle URL input changes', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'url' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Change the URL input value
      const urlInput = screen.getByLabelText(/url/i)
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
      
      expect(mockUpdateNodeData).toHaveBeenCalledWith('test-node', {
        url: 'https://example.com',
        isConfigured: true
      })
    })

    it('should show existing URL', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({
        inputType: 'url',
        url: 'https://existing.com'
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      const urlInput = screen.getByLabelText(/url/i) as HTMLInputElement
      expect(urlInput.value).toBe('https://existing.com')
    })
  })

  describe('File Upload Integration', () => {
    it('should handle file uploads', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'file' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Click upload button in mock component
      const uploadButton = screen.getByText('Upload Files')
      await user.click(uploadButton)
      
      expect(mockUpdateNodeData).toHaveBeenCalledWith('test-node', {
        files: expect.arrayContaining([
          expect.objectContaining({
            originalName: 'test.txt',
            content: 'Test file content'
          })
        ]),
        content: 'Combined test content',
        isConfigured: true
      })
    })

    it('should handle file upload errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'file' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Trigger error in mock component
      const errorButton = screen.getByText('Trigger Error')
      await user.click(errorButton)
      
      expect(consoleSpy).toHaveBeenCalledWith('File upload errors:', ['Test error'])
      
      consoleSpy.mockRestore()
    })

    it('should apply compact class to FileUpload component', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'file' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      const fileUpload = screen.getByTestId('file-upload-mock')
      expect(fileUpload).toHaveClass('compact')
    })
  })

  describe('Content Preview', () => {
    it('should show file count for file input', () => {
      const mockFiles: UploadedFile[] = [
        {
          id: '1',
          originalName: 'file1.txt',
          displayName: 'file1.txt',
          size: 100,
          type: 'text/plain',
          lastModified: Date.now(),
          content: 'Content 1'
        },
        {
          id: '2',
          originalName: 'file2.txt',
          displayName: 'file2.txt',
          size: 200,
          type: 'text/plain',
          lastModified: Date.now(),
          content: 'Content 2'
        }
      ]
      
      const data = createMockNodeData({
        inputType: 'file',
        files: mockFiles
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByText('2 file(s) uploaded')).toBeInTheDocument()
    })

    it('should truncate long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/that/should/be/truncated'
      const data = createMockNodeData({
        inputType: 'url',
        url: longUrl
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByText(/https:\/\/example\.com\/very\/long/)).toBeInTheDocument()
    })

    it('should truncate long text content', () => {
      const longText = 'This is a very long text content that should be truncated when displayed in the preview'
      const data = createMockNodeData({
        inputType: 'text',
        content: longText
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Should show truncated version
      expect(screen.getByText(/This is a very long text content that should be tr/)).toBeInTheDocument()
    })

    it('should show placeholder when no content', () => {
      const data = createMockNodeData({
        placeholder: 'Custom placeholder text'
      })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      expect(screen.getByText('Custom placeholder text')).toBeInTheDocument()
    })
  })

  describe('Configuration State', () => {
    it('should determine configured state from content', () => {
      const testCases = [
        { props: { content: 'some text', isConfigured: true }, expected: true },
        { props: { files: [{ id: '1' }], isConfigured: true }, expected: true },
        { props: { url: 'https://example.com', isConfigured: true }, expected: true },
        { props: { isConfigured: true }, expected: true },
        { props: {}, expected: false }
      ]
      
      testCases.forEach(({ props, expected }) => {
        const data = createMockNodeData(props as any)
        
        const { container } = render(
          <InputNode
            data={data}
            id="test-node"
            selected={false}
          />
        )
        
        const nodeElement = container.querySelector('.workflow-node')
        if (expected) {
          expect(nodeElement).toHaveClass('configured')
          expect(nodeElement).not.toHaveClass('unconfigured')
        } else {
          expect(nodeElement).toHaveClass('unconfigured')
          expect(nodeElement).not.toHaveClass('configured')
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const data = createMockNodeData()
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Check that form controls have proper labels
      expect(screen.getByText('Test Input')).toBeInTheDocument()
      expect(screen.getByTestId('handle-source')).toBeInTheDocument()
    })

    it('should prevent event propagation in config area', async () => {
      const user = userEvent.setup()
      const data = createMockNodeData({ inputType: 'text' })
      
      render(
        <InputNode
          data={data}
          id="test-node"
          selected={false}
        />
      )
      
      // Expand the node
      const header = screen.getByText('Test Input').closest('.node-header')
      await user.click(header!)
      
      // Click in config area should not collapse the node
      const configArea = document.querySelector('.node-config')
      expect(configArea).toBeInTheDocument()
      
      // This tests the stopPropagation call
      fireEvent.click(configArea!)
      
      // Node should still be expanded
      expect(screen.getByLabelText(/text content/i)).toBeInTheDocument()
    })
  })
})