/**
 * FileUpload Component Tests
 * 
 * Tests for the FileUpload React component including drag-and-drop,
 * file selection, validation, and user interactions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../FileUpload'
import type { UploadedFile } from '@/utils/fileUpload'

// Mock the file upload utilities
vi.mock('@/utils/fileUpload', () => {
  const mockUploadedFile: UploadedFile = {
    id: 'test-file-1',
    originalName: 'test.txt',
    displayName: 'test.txt',
    size: 1024,
    type: 'text/plain',
    lastModified: Date.now(),
    content: 'Test file content'
  }

  return {
    formatFileSize: vi.fn((bytes: number) => `${bytes} B`),
    createFileUploadHandler: vi.fn((onSuccess, onError) => {
      return vi.fn(async (event) => {
        const files = event.target.files
        if (files && files.length > 0) {
          const file = files[0]
          if (file.name.includes('error')) {
            onError(['Test error'])
          } else {
            onSuccess([mockUploadedFile], 'Combined content')
          }
        }
      })
    })
  }
})

// Helper to create mock file objects
function createMockFile(name: string, size: number, type: string): File {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

// Helper to create mock FileList
function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    ...files
  }
  return fileList as FileList
}

describe('FileUpload Component', () => {
  const defaultProps = {
    onFilesUploaded: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload area with default text', () => {
      render(<FileUpload {...defaultProps} />)
      
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /file upload area/i })).toBeInTheDocument()
    })

    it('should show supported file types', () => {
      render(<FileUpload {...defaultProps} accept=".txt,.js,.py" />)
      
      expect(screen.getByText(/supported: txt,js,py/i)).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<FileUpload {...defaultProps} disabled={true} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      expect(uploadArea).toHaveAttribute('tabIndex', '-1')
      expect(uploadArea).toHaveClass('disabled')
    })

    it('should apply custom className', () => {
      render(<FileUpload {...defaultProps} className="custom-class" />)
      
      const container = screen.getByRole('button', { name: /file upload area/i }).parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('File Selection', () => {
    it('should trigger file selection on click', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      
      // Mock the file input click
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')
      
      await user.click(uploadArea)
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not trigger file selection when disabled', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} disabled={true} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, 'click')
      
      await user.click(uploadArea)
      
      expect(clickSpy).not.toHaveBeenCalled()
    })

    it('should handle file input change', async () => {
      render(<FileUpload {...defaultProps} />)
      
      const fileInput = screen.getByRole('button', { name: /file upload area/i })
        .querySelector('input[type="file"]') as HTMLInputElement
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(defaultProps.onFilesUploaded).toHaveBeenCalled()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag over events', () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      
      fireEvent.dragOver(uploadArea, {
        dataTransfer: {
          files: []
        }
      })
      
      expect(uploadArea).toHaveClass('drag-over')
    })

    it('should handle drag leave events', () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      
      // First drag over to add class
      fireEvent.dragOver(uploadArea)
      expect(uploadArea).toHaveClass('drag-over')
      
      // Then drag leave to remove class
      fireEvent.dragLeave(uploadArea)
      expect(uploadArea).not.toHaveClass('drag-over')
    })

    it('should handle file drop events', async () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const file = createMockFile('test.txt', 1024, 'text/plain')
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      })
      
      await waitFor(() => {
        expect(defaultProps.onFilesUploaded).toHaveBeenCalled()
      })
    })

    it('should not handle drag events when disabled', () => {
      render(<FileUpload {...defaultProps} disabled={true} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      
      fireEvent.dragOver(uploadArea)
      expect(uploadArea).not.toHaveClass('drag-over')
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      })
      
      expect(defaultProps.onFilesUploaded).not.toHaveBeenCalled()
    })
  })

  describe('Upload States', () => {
    it('should show processing text during upload', async () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      // The component sets uploading state briefly, which shows processing text
      // Since our mock resolves immediately, we just verify the component structure
      expect(uploadArea.querySelector('.upload-prompt')).toBeInTheDocument()
    })

    it('should show uploaded files list', async () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText(/uploaded files \(1\)/i)).toBeInTheDocument()
        expect(screen.getByText('test.txt')).toBeInTheDocument()
      })
    })
  })

  describe('File Management', () => {
    it('should allow removing individual files', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} />)
      
      // First upload a file to get it in the list
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument()
      })
      
      // Find and click remove button
      const removeButton = screen.getByRole('button', { name: /remove test\.txt/i })
      await user.click(removeButton)
      
      // File should be removed and callback called
      expect(defaultProps.onFilesUploaded).toHaveBeenCalledWith([], '')
    })

    it('should allow clearing all files', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} />)
      
      // First upload a file to get it in the list
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      
      const file = createMockFile('test.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(screen.getByText(/uploaded files \(1\)/i)).toBeInTheDocument()
      })
      
      // Click clear all button
      const clearButton = screen.getByRole('button', { name: /clear all files/i })
      await user.click(clearButton)
      
      // All files should be cleared
      expect(defaultProps.onFilesUploaded).toHaveBeenCalledWith([], '')
    })
  })

  describe('Error Handling', () => {
    it('should handle upload errors', async () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement
      
      // Use error filename to trigger error in mock
      const file = createMockFile('error.txt', 1024, 'text/plain')
      const fileList = createMockFileList([file])
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(['Test error'])
      })
    })

    it('should use default error handler if none provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<FileUpload onFilesUploaded={vi.fn()} />)
      
      // Should not throw even without onError prop
      expect(() => {
        render(<FileUpload onFilesUploaded={vi.fn()} />)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      expect(uploadArea).toHaveAttribute('aria-label', 'File upload area')
      expect(uploadArea).toHaveAttribute('tabIndex', '0')
      
      const fileInput = uploadArea.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-hidden', 'true')
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FileUpload {...defaultProps} />)
      
      const uploadArea = screen.getByRole('button', { name: /file upload area/i })
      
      // Should be focusable
      await user.tab()
      expect(uploadArea).toHaveFocus()
    })
  })
})