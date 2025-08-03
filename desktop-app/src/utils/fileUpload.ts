/**
 * File Upload Utilities
 * 
 * Provides file upload handling with duplicate detection,
 * content reading, and file management capabilities.
 */

export interface UploadedFile {
  id: string
  originalName: string
  displayName: string
  size: number
  type: string
  lastModified: number
  content: string
}

export interface FileUploadOptions {
  allowedTypes?: string[]
  maxSize?: number
  maxFiles?: number
}

const DEFAULT_OPTIONS: FileUploadOptions = {
  allowedTypes: ['.txt', '.md', '.json', '.js', '.py', '.html', '.css', '.csv', '.xml'],
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: FileUploadOptions = DEFAULT_OPTIONS): { valid: boolean; error?: string } {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(options.maxSize)})`
    }
  }
  
  // Check file type if specified
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!options.allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type ${fileExtension} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      resolve(content || '')
    }
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Handle multiple file uploads with duplicate detection
 */
export async function processFileList(fileList: FileList, options: FileUploadOptions = DEFAULT_OPTIONS): Promise<{
  files: UploadedFile[]
  errors: string[]
}> {
  const files: UploadedFile[] = []
  const errors: string[] = []
  
  // Check max files limit
  if (options.maxFiles && fileList.length > options.maxFiles) {
    errors.push(`Too many files selected. Maximum allowed: ${options.maxFiles}`)
    return { files, errors }
  }
  
  // Track filenames for duplicate detection
  const filenameCount: Record<string, number> = {}
  const currentCount: Record<string, number> = {}
  
  // First pass: count duplicates
  Array.from(fileList).forEach((file) => {
    const basename = file.name
    filenameCount[basename] = (filenameCount[basename] || 0) + 1
  })
  
  // Second pass: process files
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    
    try {
      // Validate file
      const validation = validateFile(file, options)
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`)
        continue
      }
      
      // Generate display name with number if duplicate
      let displayName = file.name
      if (filenameCount[file.name] > 1) {
        currentCount[file.name] = (currentCount[file.name] || 0) + 1
        displayName = `${file.name} (${currentCount[file.name]})`
      }
      
      // Read file content
      const content = await readFileAsText(file)
      
      // Create uploaded file object
      const uploadedFile: UploadedFile = {
        id: `file-${i}-${Date.now()}`,
        originalName: file.name,
        displayName,
        size: file.size,
        type: file.type || 'text/plain',
        lastModified: file.lastModified,
        content
      }
      
      files.push(uploadedFile)
      
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return { files, errors }
}

/**
 * Combine multiple files into a single content string
 */
export function combineFileContents(files: UploadedFile[], existingContent = ''): string {
  let combinedContent = existingContent ? existingContent + '\n\n' : ''
  
  files.forEach((file, index) => {
    if (index > 0 || existingContent) {
      combinedContent += '\n\n'
    }
    combinedContent += `--- File: ${file.displayName} ---\n\n${file.content}`
  })
  
  return combinedContent
}

/**
 * Create file upload handler for input elements
 */
export function createFileUploadHandler(
  onFilesUploaded: (files: UploadedFile[], combinedContent: string) => void,
  onError: (errors: string[]) => void,
  options: FileUploadOptions = DEFAULT_OPTIONS
) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) {
      return
    }
    
    try {
      const result = await processFileList(fileList, options)
      
      if (result.errors.length > 0) {
        onError(result.errors)
      }
      
      if (result.files.length > 0) {
        const combinedContent = combineFileContents(result.files)
        onFilesUploaded(result.files, combinedContent)
      }
      
    } catch (error) {
      onError([error instanceof Error ? error.message : 'File upload failed'])
    }
  }
}