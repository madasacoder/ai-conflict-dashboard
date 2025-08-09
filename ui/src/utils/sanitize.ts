/**
 * Input sanitization utilities for XSS protection
 */

import DOMPurify from 'dompurify'

// Configure DOMPurify for our use case
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'br', 'p', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
}

// Special characters that need escaping in different contexts
const SPECIAL_CHARS = {
  HTML: {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  },
  SQL: {
    "'": "''",
    '"': '""',
    '\\': '\\\\',
    '\0': '\\0',
    '\n': '\\n',
    '\r': '\\r',
    '\x1a': '\\Z'
  },
  REGEX: {
    '.': '\\.',
    '*': '\\*',
    '+': '\\+',
    '?': '\\?',
    '^': '\\^',
    '$': '\\$',
    '{': '\\{',
    '}': '\\}',
    '(': '\\(',
    ')': '\\)',
    '|': '\\|',
    '[': '\\[',
    ']': '\\]',
    '\\': '\\\\'
  },
  URL: {
    ' ': '%20',
    '!': '%21',
    '#': '%23',
    '$': '%24',
    '&': '%26',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '*': '%2A',
    '+': '%2B',
    ',': '%2C',
    '/': '%2F',
    ':': '%3A',
    ';': '%3B',
    '=': '%3D',
    '?': '%3F',
    '@': '%40',
    '[': '%5B',
    ']': '%5D'
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }
  
  // Use DOMPurify to clean the input
  return DOMPurify.sanitize(input, purifyConfig)
}

/**
 * Sanitize plain text (no HTML allowed)
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }
  
  // Remove all HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize JSON input
 */
export function sanitizeJSON(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizePlainText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJSON(item))
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizePlainText(key)
        sanitized[sanitizedKey] = sanitizeJSON(obj[key])
      }
    }
    return sanitized
  }
  
  return obj
}

/**
 * Escape special characters in a string based on context
 */
export function escapeSpecialChars(input: string, context: 'HTML' | 'SQL' | 'REGEX' | 'URL' = 'HTML'): string {
  if (typeof input !== 'string') {
    return String(input)
  }
  
  const chars = SPECIAL_CHARS[context]
  let escaped = input
  
  // Sort keys by length (descending) to avoid replacing partial matches
  const sortedKeys = Object.keys(chars).sort((a, b) => b.length - a.length)
  
  sortedKeys.forEach(char => {
    const replacement = chars[char]
    // Use global replace for all occurrences
    escaped = escaped.split(char).join(replacement)
  })
  
  return escaped
}

/**
 * Remove null bytes and other dangerous characters
 */
export function removeNullBytes(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }
  
  // Remove null bytes and other control characters
  return input
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    .replace(/[\uFEFF\u200B\u200C\u200D]/g, '') // Zero-width characters
}

/**
 * Sanitize file paths to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    return ''
  }
  
  // Remove any directory traversal attempts
  let sanitized = path
    .replace(/\.\.\/|\.\.\\/g, '') // Remove ../
    .replace(/^\.\./, '') // Remove leading ..
    .replace(/\/\.\./g, '') // Remove /..
    .replace(/\\\.\./g, '') // Remove \..
    .replace(/^[/\\]+/, '') // Remove leading slashes
    .replace(/\0/g, '') // Remove null bytes
  
  // Remove any remaining dangerous patterns
  sanitized = sanitized
    .replace(/[<>:"|?*]/g, '_') // Replace invalid filename chars
    .replace(/\s+/g, '_') // Replace whitespace with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
  
  return sanitized
}

/**
 * Sanitize workflow node data
 */
export function sanitizeNodeData(data: any): any {
  const sanitized = { ...data }
  
  // Sanitize common text fields
  if (sanitized.label) {
    sanitized.label = removeNullBytes(sanitizePlainText(sanitized.label))
  }
  
  if (sanitized.description) {
    sanitized.description = removeNullBytes(sanitizePlainText(sanitized.description))
  }
  
  if (sanitized.prompt) {
    sanitized.prompt = removeNullBytes(sanitizeInput(sanitized.prompt))
  }
  
  if (sanitized.placeholder) {
    sanitized.placeholder = removeNullBytes(sanitizePlainText(sanitized.placeholder))
  }
  
  if (sanitized.value) {
    sanitized.value = removeNullBytes(sanitizeInput(sanitized.value))
  }
  
  // Special handling for file paths
  if (sanitized.filePath) {
    sanitized.filePath = sanitizeFilePath(sanitized.filePath)
  }
  
  // Special handling for URLs
  if (sanitized.url) {
    try {
      const url = new URL(sanitized.url)
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        sanitized.url = ''
      }
    } catch {
      sanitized.url = ''
    }
  }
  
  // Recursively sanitize any nested config
  if (sanitized.config) {
    sanitized.config = sanitizeJSON(sanitized.config)
  }
  
  return sanitized
}

/**
 * Validate and sanitize workflow import
 */
export function sanitizeWorkflowImport(workflowData: any): any {
  if (!workflowData || typeof workflowData !== 'object') {
    throw new Error('Invalid workflow data')
  }
  
  const sanitized: any = {}
  
  // Sanitize workflow metadata
  if (workflowData.workflow) {
    // Validate workflow ID - prevent directory traversal and special chars
    const workflowId = sanitizeFilePath(workflowData.workflow.id || '')
    if (!workflowId) {
      throw new Error('Invalid workflow ID')
    }
    
    sanitized.workflow = {
      ...workflowData.workflow,
      id: workflowId,
      name: removeNullBytes(sanitizePlainText(workflowData.workflow.name || 'Untitled')),
      description: removeNullBytes(sanitizePlainText(workflowData.workflow.description || '')),
      tags: Array.isArray(workflowData.workflow.tags) 
        ? workflowData.workflow.tags.map((tag: string) => removeNullBytes(sanitizePlainText(tag)))
        : []
    }
  }
  
  // Sanitize nodes with enhanced special character handling
  if (Array.isArray(workflowData.nodes)) {
    sanitized.nodes = workflowData.nodes.map((node: any) => {
      // Validate node ID
      const nodeId = removeNullBytes(sanitizePlainText(node.id || ''))
      if (!nodeId || nodeId.length > 100) {
        throw new Error(`Invalid node ID: ${node.id}`)
      }
      
      // Validate node type
      const validTypes = ['input', 'llm', 'compare', 'summarize', 'output']
      const nodeType = sanitizePlainText(node.type || '')
      if (!validTypes.includes(nodeType)) {
        throw new Error(`Invalid node type: ${node.type}`)
      }
      
      return {
        ...node,
        id: nodeId,
        type: nodeType,
        data: sanitizeNodeData(node.data || {})
      }
    })
  }
  
  // Sanitize edges with validation
  if (Array.isArray(workflowData.edges)) {
    sanitized.edges = workflowData.edges.map((edge: any) => {
      const edgeId = removeNullBytes(sanitizePlainText(edge.id || ''))
      const source = removeNullBytes(sanitizePlainText(edge.source || ''))
      const target = removeNullBytes(sanitizePlainText(edge.target || ''))
      
      // Validate edge references existing nodes
      if (sanitized.nodes) {
        const nodeIds = new Set(sanitized.nodes.map((n: any) => n.id))
        if (!nodeIds.has(source) || !nodeIds.has(target)) {
          console.warn(`Edge references non-existent nodes: ${source} -> ${target}`)
          return null // Will be filtered out
        }
      }
      
      return {
        ...edge,
        id: edgeId,
        source,
        target,
        sourceHandle: sanitizePlainText(edge.sourceHandle || ''),
        targetHandle: sanitizePlainText(edge.targetHandle || '')
      }
    }).filter(Boolean) // Remove invalid edges
  }
  
  return sanitized
}

/**
 * Sanitize user-generated content for display
 */
export function sanitizeForDisplay(content: string): string {
  if (typeof content !== 'string') {
    return String(content)
  }
  
  // First remove dangerous characters
  let safe = removeNullBytes(content)
  
  // Then sanitize HTML
  safe = DOMPurify.sanitize(safe, purifyConfig)
  
  // Finally escape any remaining special HTML chars
  safe = escapeSpecialChars(safe, 'HTML')
  
  return safe
}

/**
 * Validate and sanitize API responses
 */
export function sanitizeAPIResponse(response: any): any {
  if (typeof response === 'string') {
    return removeNullBytes(sanitizePlainText(response))
  }
  
  if (Array.isArray(response)) {
    return response.map(item => sanitizeAPIResponse(item))
  }
  
  if (response !== null && typeof response === 'object') {
    const sanitized: any = {}
    for (const key in response) {
      if (response.hasOwnProperty(key)) {
        // Sanitize key
        const sanitizedKey = removeNullBytes(sanitizePlainText(key))
        // Recursively sanitize value
        sanitized[sanitizedKey] = sanitizeAPIResponse(response[key])
      }
    }
    return sanitized
  }
  
  return response
}