/**
 * FileUpload Component
 * 
 * Provides drag-and-drop and click-to-upload file functionality
 * with preview, validation, and file management.
 */

import React, { useCallback, useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { 
  UploadedFile, 
  FileUploadOptions, 
  createFileUploadHandler, 
  formatFileSize 
} from '@/utils/fileUpload'

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[], combinedContent: string) => void
  onError?: (errors: string[]) => void
  options?: FileUploadOptions
  disabled?: boolean
  className?: string
  accept?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onError = (errors) => console.error('File upload errors:', errors),
  options,
  disabled = false,
  className = '',
  accept = '.txt,.md,.json,.js,.py,.html,.css,.csv,.xml'
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Create file upload handler
  const handleFileUpload = createFileUploadHandler(
    (files, combinedContent) => {
      setUploadedFiles(files)
      onFilesUploaded(files, combinedContent)
      setIsUploading(false)
    },
    (errors) => {
      onError(errors)
      setIsUploading(false)
    },
    options
  )
  
  // Handle file input change
  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    await handleFileUpload(event)
    // Clear input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileUpload])
  
  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])
  
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }, [])
  
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      setIsUploading(true)
      // Create a synthetic event for the handler
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>
      
      await handleFileUpload(syntheticEvent)
    }
  }, [disabled, handleFileUpload])
  
  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])
  
  // Remove a file
  const removeFile = useCallback((fileId: string) => {
    const newFiles = uploadedFiles.filter(file => file.id !== fileId)
    setUploadedFiles(newFiles)
    
    // Update combined content
    const combinedContent = newFiles.map((file, index) => {
      const separator = index > 0 ? '\n\n' : ''
      return `${separator}--- File: ${file.displayName} ---\n\n${file.content}`
    }).join('')
    
    onFilesUploaded(newFiles, combinedContent)
  }, [uploadedFiles, onFilesUploaded])
  
  // Clear all files
  const clearAllFiles = useCallback(() => {
    setUploadedFiles([])
    onFilesUploaded([], '')
  }, [onFilesUploaded])
  
  return (
    <div className={`file-upload-container ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          file-upload-area 
          ${isDragOver ? 'drag-over' : ''} 
          ${disabled ? 'disabled' : ''} 
          ${isUploading ? 'uploading' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area"
      >
        {isUploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Processing files...</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <Upload size={24} className="upload-icon" />
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop files here
            </p>
            <p className="upload-hint">
              Supported: {accept.replace(/\./g, '').toUpperCase()}
            </p>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <div className="files-header">
            <h4>Uploaded Files ({uploadedFiles.length})</h4>
            <button
              type="button"
              className="clear-all-btn"
              onClick={clearAllFiles}
              disabled={disabled}
              aria-label="Clear all files"
            >
              Clear All
            </button>
          </div>
          
          <div className="files-list">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <FileText size={16} className="file-icon" />
                  <div className="file-details">
                    <div className="file-name" title={file.originalName}>
                      {file.displayName}
                    </div>
                    <div className="file-meta">
                      {formatFileSize(file.size)} • {file.type}
                    </div>
                  </div>
                </div>
                
                <div className="file-status">
                  <CheckCircle size={16} className="success-icon" />
                </div>
                
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => removeFile(file.id)}
                  disabled={disabled}
                  aria-label={`Remove ${file.displayName}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload