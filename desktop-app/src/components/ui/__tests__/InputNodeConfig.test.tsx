/**
 * InputNodeConfig Component Tests
 * 
 * Tests for the Input node configuration form including
 * input type selection, placeholder configuration, and file settings.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputNodeConfig } from '../NodeConfigs/InputNodeConfig'
import { Node } from '@/types/workflow'

const mockNode: Node = {
  id: 'input-1',
  type: 'input',
  position: { x: 0, y: 0 },
  data: {
    label: 'Input Node',
    inputType: 'text',
    placeholder: 'Enter your text here...',
    acceptedTypes: '.txt,.pdf,.docx,.md',
    multiple: false,
    autoFetch: false,
    defaultContent: '',
    required: false
  }
}

const mockOnUpdate = vi.fn()

describe('InputNodeConfig Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render input configuration form', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByText('Input Configuration')).toBeInTheDocument()
      expect(screen.getByLabelText('Node Label')).toBeInTheDocument()
      expect(screen.getByText('Input Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Placeholder Text')).toBeInTheDocument()
    })

    it('should show current node data in form fields', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByDisplayValue('Input Node')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Enter your text here...')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /text input/i })).toBeChecked()
    })

    it('should show default values when node data is empty', () => {
      const emptyNode: Node = {
        ...mockNode,
        data: {}
      }

      render(<InputNodeConfig node={emptyNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByRole('radio', { name: /text input/i })).toBeChecked()
      expect(screen.getByPlaceholderText('Custom label for this input node')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should update node label when changed', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const labelInput = screen.getByLabelText('Node Label')
      fireEvent.change(labelInput, { target: { value: 'Updated Input' } })
      
      expect(mockOnUpdate).toHaveBeenCalledWith('label', 'Updated Input')
    })

    it('should update placeholder when changed', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const placeholderInput = screen.getByLabelText('Placeholder Text')
      fireEvent.change(placeholderInput, { target: { value: 'Custom placeholder' } })
      
      expect(mockOnUpdate).toHaveBeenCalledWith('placeholder', 'Custom placeholder')
    })

    it('should update default content when changed', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const contentTextarea = screen.getByLabelText('Default Content')
      fireEvent.change(contentTextarea, { target: { value: 'Default text content' } })
      
      expect(mockOnUpdate).toHaveBeenCalledWith('defaultContent', 'Default text content')
    })
  })

  describe('Input Type Selection', () => {
    it('should change input type to file when selected', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const fileRadio = screen.getByRole('radio', { name: /file upload/i })
      await user.click(fileRadio)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('inputType', 'file')
      expect(mockOnUpdate).toHaveBeenCalledWith('placeholder', 'Select files to upload...')
    })

    it('should change input type to URL when selected', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const urlRadio = screen.getByRole('radio', { name: /url input/i })
      await user.click(urlRadio)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('inputType', 'url')
      expect(mockOnUpdate).toHaveBeenCalledWith('placeholder', 'Enter URL to fetch content...')
    })

    it('should change input type to text when selected', async () => {
      const user = userEvent.setup()
      const fileNode = { ...mockNode, data: { ...mockNode.data, inputType: 'file' } }
      
      render(<InputNodeConfig node={fileNode} onUpdate={mockOnUpdate} />)
      
      const textRadio = screen.getByRole('radio', { name: /text input/i })
      await user.click(textRadio)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('inputType', 'text')
      expect(mockOnUpdate).toHaveBeenCalledWith('placeholder', 'Enter your text here...')
    })
  })

  describe('File Input Settings', () => {
    it('should show file-specific settings when file input is selected', () => {
      const fileNode = { ...mockNode, data: { ...mockNode.data, inputType: 'file' } }
      
      render(<InputNodeConfig node={fileNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByLabelText('Accepted File Types')).toBeInTheDocument()
      expect(screen.getByLabelText('Allow Multiple Files')).toBeInTheDocument()
    })

    it('should not show file settings for text input', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.queryByLabelText('Accepted File Types')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Allow Multiple Files')).not.toBeInTheDocument()
    })

    it('should update accepted file types', async () => {
      const user = userEvent.setup()
      const fileNode = { ...mockNode, data: { ...mockNode.data, inputType: 'file' } }
      
      render(<InputNodeConfig node={fileNode} onUpdate={mockOnUpdate} />)
      
      const fileTypesInput = screen.getByLabelText('Accepted File Types')
      fireEvent.change(fileTypesInput, { target: { value: '.txt,.csv' } })
      
      expect(mockOnUpdate).toHaveBeenCalledWith('acceptedTypes', '.txt,.csv')
    })

    it('should toggle multiple files setting', async () => {
      const user = userEvent.setup()
      const fileNode = { ...mockNode, data: { ...mockNode.data, inputType: 'file' } }
      
      render(<InputNodeConfig node={fileNode} onUpdate={mockOnUpdate} />)
      
      const multipleCheckbox = screen.getByLabelText('Allow Multiple Files')
      await user.click(multipleCheckbox)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('multiple', true)
    })
  })

  describe('URL Input Settings', () => {
    it('should show URL-specific settings when URL input is selected', () => {
      const urlNode = { ...mockNode, data: { ...mockNode.data, inputType: 'url' } }
      
      render(<InputNodeConfig node={urlNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByLabelText('Auto-fetch Content')).toBeInTheDocument()
    })

    it('should not show URL settings for text input', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.queryByLabelText('Auto-fetch Content')).not.toBeInTheDocument()
    })

    it('should toggle auto-fetch setting', async () => {
      const user = userEvent.setup()
      const urlNode = { ...mockNode, data: { ...mockNode.data, inputType: 'url' } }
      
      render(<InputNodeConfig node={urlNode} onUpdate={mockOnUpdate} />)
      
      const autoFetchCheckbox = screen.getByLabelText('Auto-fetch Content')
      await user.click(autoFetchCheckbox)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('autoFetch', true)
    })
  })

  describe('Content Settings', () => {
    it('should toggle required input setting', async () => {
      const user = userEvent.setup()
      
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const requiredCheckbox = screen.getByLabelText('Required Input')
      await user.click(requiredCheckbox)
      
      expect(mockOnUpdate).toHaveBeenCalledWith('required', true)
    })

    it('should show help text for configuration options', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByText('This label will be displayed on the node in the workflow')).toBeInTheDocument()
      expect(screen.getByText('This text will be shown when the input field is empty')).toBeInTheDocument()
      expect(screen.getByText('This content will be pre-filled in the input field')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all form elements', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      expect(screen.getByLabelText('Node Label')).toBeInTheDocument()
      expect(screen.getByLabelText('Placeholder Text')).toBeInTheDocument()
      expect(screen.getByLabelText('Default Content')).toBeInTheDocument()
      expect(screen.getByLabelText('Required Input')).toBeInTheDocument()
    })

    it('should use proper radio button grouping', () => {
      render(<InputNodeConfig node={mockNode} onUpdate={mockOnUpdate} />)
      
      const textRadio = screen.getByRole('radio', { name: /text input/i })
      const fileRadio = screen.getByRole('radio', { name: /file upload/i })
      const urlRadio = screen.getByRole('radio', { name: /url input/i })
      
      expect(textRadio).toHaveAttribute('name', 'inputType')
      expect(fileRadio).toHaveAttribute('name', 'inputType')
      expect(urlRadio).toHaveAttribute('name', 'inputType')
    })
  })
})