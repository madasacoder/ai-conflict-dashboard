/**
 * WorkflowModal Component Tests
 * 
 * Tests for the workflow management modal including creation,
 * templates, and recent workflows functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowModal } from '../WorkflowModal'
import { useWorkflowStore } from '@/state/workflowStore'

// Mock the workflow store
vi.mock('@/state/workflowStore', () => ({
  useWorkflowStore: vi.fn()
}))

// Mock CSS imports
vi.mock('../WorkflowModal.css', () => ({}))

const mockWorkflowStore = {
  workflow: null,
  templates: [],
  recentWorkflows: [],
  createNewWorkflow: vi.fn(),
  loadTemplate: vi.fn(),
  duplicateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  saveAsTemplate: vi.fn(),
  exportWorkflow: vi.fn(),
  importWorkflow: vi.fn()
}

describe('WorkflowModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useWorkflowStore as any).mockReturnValue(mockWorkflowStore)
  })

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <WorkflowModal
          isOpen={false}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      expect(screen.queryByText('Create New Workflow')).not.toBeInTheDocument()
    })

    it('should render create mode when open', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument()
      expect(screen.getByLabelText(/workflow name/i)).toBeInTheDocument()
    })

    it('should render manage mode', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="manage"
        />
      )
      
      expect(screen.getByText('Manage Workflows')).toBeInTheDocument()
      expect(screen.getByText(/recent \(0\)/i)).toBeInTheDocument()
    })

    it('should render templates mode', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="templates"
        />
      )
      
      expect(screen.getByText('Workflow Templates')).toBeInTheDocument()
      expect(screen.getByText(/templates \(0\)/i)).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      // Should start on create tab
      expect(screen.getByText('Create New')).toHaveClass('active')
      
      // Switch to recent tab
      const recentTab = screen.getByRole('button', { name: /recent/i })
      await user.click(recentTab)
      expect(recentTab).toHaveClass('active')
      
      // Switch to templates tab
      const templatesTab = screen.getByRole('button', { name: /templates/i })
      await user.click(templatesTab)
      expect(templatesTab).toHaveClass('active')
    })

    it('should show correct tab based on mode prop', () => {
      const { rerender } = render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="templates"
        />
      )
      
      expect(screen.getByRole('button', { name: /templates/i })).toHaveClass('active')
      
      rerender(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="manage"
        />
      )
      
      expect(screen.getByRole('button', { name: /recent/i })).toHaveClass('active')
    })
  })

  describe('Create Workflow Form', () => {
    it('should handle form input changes', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const nameInput = screen.getByLabelText(/workflow name/i)
      const descInput = screen.getByLabelText(/description/i)
      
      await user.type(nameInput, 'Test Workflow')
      await user.type(descInput, 'A test workflow')
      
      expect(nameInput).toHaveValue('Test Workflow')
      expect(descInput).toHaveValue('A test workflow')
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      // Try to create without name
      await user.click(screen.getByText('Create Workflow'))
      
      expect(screen.getByText('Workflow name is required')).toBeInTheDocument()
      expect(mockWorkflowStore.createNewWorkflow).not.toHaveBeenCalled()
    })

    it('should validate minimum name length', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const nameInput = screen.getByLabelText(/workflow name/i)
      await user.type(nameInput, 'ab')
      await user.click(screen.getByText('Create Workflow'))
      
      expect(screen.getByText('Workflow name must be at least 3 characters')).toBeInTheDocument()
      expect(mockWorkflowStore.createNewWorkflow).not.toHaveBeenCalled()
    })

    it('should create workflow with valid data', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      )
      
      const nameInput = screen.getByLabelText(/workflow name/i)
      const descInput = screen.getByLabelText(/description/i)
      
      await user.type(nameInput, 'Test Workflow')
      await user.type(descInput, 'A test workflow')
      await user.click(screen.getByText('Create Workflow'))
      
      expect(mockWorkflowStore.createNewWorkflow).toHaveBeenCalledWith(
        'Test Workflow',
        'A test workflow'
      )
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle icon selection', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      // Find icon buttons
      const iconButtons = document.querySelectorAll('.icon-option')
      expect(iconButtons.length).toBeGreaterThan(0)
      
      // Default first icon should be selected initially
      expect(iconButtons[0]).toHaveClass('selected')
      
      // Click a different icon
      await user.click(iconButtons[1] as Element)
      
      expect(iconButtons[1]).toHaveClass('selected')
      expect(iconButtons[0]).not.toHaveClass('selected')
    })

    it('should handle color selection', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      // Find color options and click one
      const colorOptions = document.querySelectorAll('.color-option')
      expect(colorOptions.length).toBeGreaterThan(0)
      
      await user.click(colorOptions[1] as Element)
      expect(colorOptions[1]).toHaveClass('selected')
    })

    it('should handle tag management', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const tagInput = screen.getByPlaceholderText('Add a tag...')
      const addButton = screen.getByText('Add')
      
      // Add a tag
      await user.type(tagInput, 'analysis')
      await user.click(addButton)
      
      expect(screen.getByText('analysis')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
      
      // Remove the tag
      const removeButton = screen.getByText('×')
      await user.click(removeButton)
      
      expect(screen.queryByText('analysis')).not.toBeInTheDocument()
    })

    it('should handle tag addition with Enter key', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const tagInput = screen.getByPlaceholderText('Add a tag...')
      
      await user.type(tagInput, 'workflow{enter}')
      
      expect(screen.getByText('workflow')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
    })

    it('should prevent duplicate tags', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const tagInput = screen.getByPlaceholderText('Add a tag...')
      const addButton = screen.getByText('Add')
      
      // Add first tag
      await user.type(tagInput, 'test')
      await user.click(addButton)
      
      // Verify tag was added
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument()
      })
      
      // Try to add same tag again
      await user.type(tagInput, 'test')
      await user.click(addButton)
      
      // Should only have one instance in the tag display area
      await waitFor(() => {
        const tagElements = document.querySelectorAll('.tags-display .tag')
        expect(tagElements).toHaveLength(1)
      })
    })
  })

  describe('Import/Export Functionality', () => {
    it('should handle workflow import', async () => {
      const user = userEvent.setup()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const importTextarea = screen.getByPlaceholderText('Paste workflow JSON here...')
      const importButton = screen.getByText('Import')
      
      const mockWorkflowJson = JSON.stringify({
        workflow: { id: 'test', name: 'Test' },
        nodes: [],
        edges: []
      })
      
      // Use fireEvent.change instead of user.type for JSON content
      fireEvent.change(importTextarea, { target: { value: mockWorkflowJson } })
      await user.click(importButton)
      
      expect(mockWorkflowStore.importWorkflow).toHaveBeenCalledWith(mockWorkflowJson)
    })

    it('should handle import errors', async () => {
      const user = userEvent.setup()
      mockWorkflowStore.importWorkflow.mockImplementation(() => {
        throw new Error('Invalid JSON')
      })
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const importTextarea = screen.getByPlaceholderText('Paste workflow JSON here...')
      const importButton = screen.getByText('Import')
      
      fireEvent.change(importTextarea, { target: { value: 'invalid json' } })
      await user.click(importButton)
      
      expect(screen.getByText('Invalid JSON')).toBeInTheDocument()
    })

    it('should disable import button when textarea is empty', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="create"
        />
      )
      
      const importButton = screen.getByText('Import')
      expect(importButton).toBeDisabled()
    })
  })

  describe('Recent Workflows', () => {
    it('should show empty state when no recent workflows', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="manage"
        />
      )
      
      expect(screen.getByText('No Recent Workflows')).toBeInTheDocument()
      expect(screen.getByText('Create your first workflow to get started.')).toBeInTheDocument()
    })

    it('should display recent workflows', () => {
      const mockRecentWorkflows = [
        {
          id: '1',
          name: 'Test Workflow',
          description: 'A test workflow',
          icon: '🔄',
          color: '#3498db',
          tags: ['test'],
          created: new Date(),
          modified: new Date(),
          isTemplate: false
        }
      ]
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        recentWorkflows: mockRecentWorkflows
      })
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="manage"
        />
      )
      
      expect(screen.getByText('Test Workflow')).toBeInTheDocument()
      expect(screen.getByText('A test workflow')).toBeInTheDocument()
      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('should handle workflow actions', async () => {
      const user = userEvent.setup()
      const mockRecentWorkflows = [
        {
          id: '1',
          name: 'Test Workflow',
          description: 'A test workflow',
          icon: '🔄',
          color: '#3498db',
          tags: [],
          created: new Date(),
          modified: new Date(),
          isTemplate: false
        }
      ]
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        recentWorkflows: mockRecentWorkflows
      })
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="manage"
        />
      )
      
      // Test duplicate action
      const duplicateBtn = screen.getByTitle('Duplicate')
      await user.click(duplicateBtn)
      expect(mockWorkflowStore.duplicateWorkflow).toHaveBeenCalled()
      
      // Test delete action
      const deleteBtn = screen.getByTitle('Delete')
      await user.click(deleteBtn)
      expect(mockWorkflowStore.deleteWorkflow).toHaveBeenCalledWith('1')
    })
  })

  describe('Templates', () => {
    it('should show empty state when no templates', () => {
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="templates"
        />
      )
      
      expect(screen.getByText('No Templates Available')).toBeInTheDocument()
    })

    it('should allow saving current workflow as template', async () => {
      const user = userEvent.setup()
      const mockCurrentWorkflow = {
        id: '1',
        name: 'Current Workflow',
        description: '',
        icon: '🔄',
        color: '#3498db',
        tags: [],
        created: new Date(),
        modified: new Date(),
        isTemplate: false
      }
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        workflow: mockCurrentWorkflow
      })
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={vi.fn()}
          mode="templates"
        />
      )
      
      const saveTemplateBtn = screen.getByText('Save Current as Template')
      await user.click(saveTemplateBtn)
      
      expect(mockWorkflowStore.saveAsTemplate).toHaveBeenCalled()
    })

    it('should load template', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const mockTemplates = [
        {
          id: 'template1',
          name: 'Analysis Template',
          description: 'Template for analysis',
          icon: '📊',
          color: '#2ecc71',
          tags: ['analysis'],
          created: new Date(),
          modified: new Date(),
          isTemplate: true
        }
      ]
      
      ;(useWorkflowStore as any).mockReturnValue({
        ...mockWorkflowStore,
        templates: mockTemplates
      })
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="templates"
        />
      )
      
      const useTemplateBtn = screen.getByText('Use Template')
      await user.click(useTemplateBtn)
      
      expect(mockWorkflowStore.loadTemplate).toHaveBeenCalledWith('template1')
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Modal Interaction', () => {
    it('should close when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      )
      
      const closeBtn = document.querySelector('.close-btn')
      await user.click(closeBtn!)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should close when overlay is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      )
      
      const overlay = document.querySelector('.workflow-modal-overlay')
      await user.click(overlay!)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should not close when modal content is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      )
      
      const modal = document.querySelector('.workflow-modal')
      await user.click(modal!)
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should handle cancel button', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(
        <WorkflowModal
          isOpen={true}
          onClose={onClose}
          mode="create"
        />
      )
      
      const cancelBtn = screen.getByText('Cancel')
      await user.click(cancelBtn)
      
      expect(onClose).toHaveBeenCalled()
    })
  })
})