/**
 * fileUpload.ts Tests
 * 
 * Comprehensive tests for file upload utilities including validation,
 * content reading, duplicate detection, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatFileSize,
  validateFile,
  readFileAsText,
  processFileList,
  combineFileContents,
  createFileUploadHandler,
  UploadedFile,
  FileUploadOptions
} from '../fileUpload'

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: (() => void) | null = null
  result: string | null = null

  readAsText(file: File) {
    // Simulate async file reading
    setTimeout(() => {
      if (file.name.includes('error')) {
        this.onerror?.()
      } else {
        this.result = `Content of ${file.name}`
        this.onload?.({ target: { result: this.result } })
      }
    }, 0)
  }
}

global.FileReader = MockFileReader as any

// Helper to create mock files
function createMockFile(name: string, size: number, type: string, content?: string): File {
  const file = new File([content || `Content of ${name}`], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

describe('fileUpload utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })

    it('should handle large numbers', () => {
      expect(formatFileSize(5 * 1024 * 1024 * 1024)).toBe('5 GB')
    })
  })

  describe('validateFile', () => {
    const defaultOptions: FileUploadOptions = {
      allowedTypes: ['.txt', '.js'],
      maxSize: 1024,
      maxFiles: 5
    }

    it('should validate file size', () => {
      const largeFile = createMockFile('large.txt', 2048, 'text/plain')
      const smallFile = createMockFile('small.txt', 512, 'text/plain')

      expect(validateFile(largeFile, defaultOptions).valid).toBe(false)
      expect(validateFile(smallFile, defaultOptions).valid).toBe(true)
    })

    it('should validate file type', () => {
      const validFile = createMockFile('test.txt', 512, 'text/plain')
      const invalidFile = createMockFile('test.pdf', 512, 'application/pdf')

      expect(validateFile(validFile, defaultOptions).valid).toBe(true)
      expect(validateFile(invalidFile, defaultOptions).valid).toBe(false)
    })

    it('should return error messages', () => {
      const largeFile = createMockFile('large.txt', 2048, 'text/plain')
      const result = validateFile(largeFile, defaultOptions)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size')
      expect(result.error).toContain('exceeds maximum')
    })

    it('should pass with no options', () => {
      const file = createMockFile('test.txt', 512, 'text/plain')
      expect(validateFile(file).valid).toBe(true)
    })
  })

  describe('readFileAsText', () => {
    it('should read file content successfully', async () => {
      const file = createMockFile('test.txt', 100, 'text/plain')
      const content = await readFileAsText(file)
      expect(content).toBe('Content of test.txt')
    })

    it('should handle read errors', async () => {
      const file = createMockFile('error.txt', 100, 'text/plain')
      await expect(readFileAsText(file)).rejects.toThrow('Failed to read file: error.txt')
    })
  })

  describe('processFileList', () => {
    it('should process multiple files successfully', async () => {
      const dt = new DataTransfer()
      dt.items.add(createMockFile('file1.txt', 100, 'text/plain'))
      dt.items.add(createMockFile('file2.txt', 200, 'text/plain'))
      const fileList = dt.files

      const result = await processFileList(fileList)

      expect(result.files).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.files[0]!.displayName).toBe('file1.txt')
      expect(result.files[1]!.displayName).toBe('file2.txt')
    })

    it('should handle duplicate filenames', async () => {
      const dt = new DataTransfer()
      dt.items.add(createMockFile('test.txt', 100, 'text/plain'))
      dt.items.add(createMockFile('test.txt', 200, 'text/plain'))
      dt.items.add(createMockFile('test.txt', 300, 'text/plain'))
      const fileList = dt.files

      const result = await processFileList(fileList)

      expect(result.files).toHaveLength(3)
      expect(result.files[0]!.displayName).toBe('test.txt (1)')
      expect(result.files[1]!.displayName).toBe('test.txt (2)')
      expect(result.files[2]!.displayName).toBe('test.txt (3)')
    })

    it('should respect max files limit', async () => {
      const dt = new DataTransfer()
      Array.from({ length: 5 }, (_, i) => dt.items.add(createMockFile(`file${i}.txt`, 100, 'text/plain')))
      const fileList = dt.files
      const options: FileUploadOptions = { maxFiles: 3 }

      const result = await processFileList(fileList, options)

      expect(result.files).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Too many files')
    })

    it('should validate individual files', async () => {
      const dt = new DataTransfer()
      dt.items.add(createMockFile('valid.txt', 100, 'text/plain'))
      dt.items.add(createMockFile('invalid.pdf', 100, 'application/pdf'))
      const fileList = dt.files
      const options: FileUploadOptions = { allowedTypes: ['.txt'] }

      const result = await processFileList(fileList, options)

      expect(result.files).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(result.files[0]!.originalName).toBe('valid.txt')
      expect(result.errors[0]).toContain('invalid.pdf')
    })

    it('should handle file reading errors', async () => {
      const dt = new DataTransfer()
      dt.items.add(createMockFile('good.txt', 100, 'text/plain'))
      dt.items.add(createMockFile('error.txt', 100, 'text/plain'))
      const fileList = dt.files

      const result = await processFileList(fileList)

      expect(result.files).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(result.files[0]!.originalName).toBe('good.txt')
      expect(result.errors[0]).toContain('error.txt')
    })
  })

  describe('combineFileContents', () => {
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

    it('should combine multiple files', () => {
      const combined = combineFileContents(mockFiles)
      
      expect(combined).toContain('--- File: file1.txt ---')
      expect(combined).toContain('Content 1')
      expect(combined).toContain('--- File: file2.txt ---')
      expect(combined).toContain('Content 2')
    })

    it('should handle empty file list', () => {
      const combined = combineFileContents([])
      expect(combined).toBe('')
    })

    it('should append to existing content', () => {
      const existing = 'Existing content'
      const combined = combineFileContents(mockFiles, existing)
      
      expect(combined.startsWith(existing)).toBe(true)
      expect(combined).toContain('--- File: file1.txt ---')
    })

    it('should handle single file', () => {
      const combined = combineFileContents([mockFiles[0]!])
      
      expect(combined).toBe('--- File: file1.txt ---\n\nContent 1')
    })
  })

  describe('createFileUploadHandler', () => {
    it('should create working upload handler', async () => {
      const onFilesUploaded = vi.fn()
      const onError = vi.fn()
      
      const handler = createFileUploadHandler(onFilesUploaded, onError)
      
      const dt = new DataTransfer()
      dt.items.add(createMockFile('test.txt', 100, 'text/plain'))
      const fileList = dt.files
      const event = { target: { files: fileList } } as React.ChangeEvent<HTMLInputElement>

      await handler(event)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onFilesUploaded).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            originalName: 'test.txt',
            content: 'Content of test.txt'
          })
        ]),
        expect.stringContaining('--- File: test.txt ---')
      )
    })

    it('should handle no files selected', async () => {
      const onFilesUploaded = vi.fn()
      const onError = vi.fn()
      
      const handler = createFileUploadHandler(onFilesUploaded, onError)
      const event = { target: { files: null } } as React.ChangeEvent<HTMLInputElement>

      await handler(event)

      expect(onFilesUploaded).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle upload errors', async () => {
      const onFilesUploaded = vi.fn()
      const onError = vi.fn()
      
      const handler = createFileUploadHandler(onFilesUploaded, onError)
      
      const dt = new DataTransfer()
      dt.items.add(createMockFile('error.txt', 100, 'text/plain'))
      const fileList = dt.files
      const event = { target: { files: fileList } } as React.ChangeEvent<HTMLInputElement>

      await handler(event)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('error.txt')
        ])
      )
    })

    it('should use custom options', async () => {
      const onFilesUploaded = vi.fn()
      const onError = vi.fn()
      const options: FileUploadOptions = { allowedTypes: ['.js'], maxSize: 50 }
      
      const handler = createFileUploadHandler(onFilesUploaded, onError, options)
      
      const dt = new DataTransfer()
      dt.items.add(createMockFile('test.txt', 100, 'text/plain'))
      const fileList = dt.files
      const event = { target: { files: fileList } } as React.ChangeEvent<HTMLInputElement>

      await handler(event)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('File size')
        ])
      )
    })
  })
})