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
 * Sanitize workflow node data
 */
export function sanitizeNodeData(data: any): any {
  const sanitized = { ...data }
  
  // Sanitize common text fields
  if (sanitized.label) {
    sanitized.label = sanitizePlainText(sanitized.label)
  }
  
  if (sanitized.description) {
    sanitized.description = sanitizePlainText(sanitized.description)
  }
  
  if (sanitized.prompt) {
    sanitized.prompt = sanitizeInput(sanitized.prompt)
  }
  
  if (sanitized.placeholder) {
    sanitized.placeholder = sanitizePlainText(sanitized.placeholder)
  }
  
  if (sanitized.value) {
    sanitized.value = sanitizeInput(sanitized.value)
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
    sanitized.workflow = {
      ...workflowData.workflow,
      id: sanitizePlainText(workflowData.workflow.id || ''),
      name: sanitizePlainText(workflowData.workflow.name || 'Untitled'),
      description: sanitizePlainText(workflowData.workflow.description || ''),
      tags: Array.isArray(workflowData.workflow.tags) 
        ? workflowData.workflow.tags.map(tag => sanitizePlainText(tag))
        : []
    }
  }
  
  // Sanitize nodes
  if (Array.isArray(workflowData.nodes)) {
    sanitized.nodes = workflowData.nodes.map(node => ({
      ...node,
      id: sanitizePlainText(node.id || ''),
      type: sanitizePlainText(node.type || ''),
      data: sanitizeNodeData(node.data || {})
    }))
  }
  
  // Sanitize edges
  if (Array.isArray(workflowData.edges)) {
    sanitized.edges = workflowData.edges.map(edge => ({
      ...edge,
      id: sanitizePlainText(edge.id || ''),
      source: sanitizePlainText(edge.source || ''),
      target: sanitizePlainText(edge.target || '')
    }))
  }
  
  return sanitized
}