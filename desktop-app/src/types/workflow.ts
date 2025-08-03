/**
 * Workflow Types - Core type definitions for the workflow system
 * 
 * Defines interfaces and types used throughout the workflow builder
 * for nodes, edges, and workflow metadata.
 */

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'

// Node types
export type NodeType = 'llm' | 'compare' | 'output' | 'input' | 'summarize'

// Base node data interface
export interface BaseNodeData {
  label?: string
  description?: string
  isConfigured?: boolean
  icon?: string
  color?: string
}

// Extended node interface compatible with React Flow
export interface Node extends ReactFlowNode {
  type: NodeType
  data: BaseNodeData & Record<string, any>
}

// Edge interface
export interface Edge extends ReactFlowEdge {
  animated?: boolean
  style?: Record<string, any>
}

// Workflow metadata
export interface WorkflowMetadata {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tags: string[]
  created: Date
  modified: Date
  isTemplate: boolean
}

// Workflow data structure
export interface WorkflowData {
  workflow: WorkflowMetadata
  nodes: Node[]
  edges: Edge[]
  version: string
}

// Node configuration interfaces
export interface LLMNodeData extends BaseNodeData {
  models?: string[]
  prompt?: string
  temperature?: number
  maxTokens?: number
  useSystemPrompt?: boolean
  topP?: number
  frequencyPenalty?: number
  retryOnError?: boolean
  streamResponse?: boolean
}

export interface InputNodeData extends BaseNodeData {
  inputType?: 'text' | 'file' | 'url'
  placeholder?: string
  acceptedTypes?: string
  multiple?: boolean
  autoFetch?: boolean
  defaultContent?: string
  required?: boolean
}

export interface CompareNodeData extends BaseNodeData {
  comparisonType?: 'conflicts' | 'consensus' | 'differences'
  analysisMethods?: string[]
  confidenceThreshold?: number
  outputFormat?: 'structured' | 'summary' | 'detailed' | 'table'
  includeMetadata?: boolean
  highlightDifferences?: boolean
  includeScores?: boolean
  ignoreCase?: boolean
  ignorePunctuation?: boolean
  normalizeWhitespace?: boolean
  customInstructions?: string
}

export interface OutputNodeData extends BaseNodeData {
  outputFormat?: 'markdown' | 'json' | 'text' | 'html' | 'csv'
  displayMode?: 'full' | 'preview' | 'summary'
  includeMetadata?: boolean
  showTimestamps?: boolean
  syntaxHighlighting?: boolean
  filename?: string
  autoExport?: boolean
  includeInputs?: boolean
  timestampFilename?: boolean
  maxPreviewLength?: number
  showLineNumbers?: boolean
  wordWrap?: boolean
  showCopyButton?: boolean
  customTemplate?: string
}

export interface SummarizeNodeData extends BaseNodeData {
  length?: 'short' | 'medium' | 'long'
  style?: 'bullets' | 'paragraph' | 'technical'
  includeKeyPoints?: boolean
  maintainTone?: boolean
}

// Union type for all node data types
export type NodeData = 
  | LLMNodeData 
  | InputNodeData 
  | CompareNodeData 
  | OutputNodeData 
  | SummarizeNodeData

// Execution result interfaces
export interface ExecutionResult {
  nodeId: string
  success: boolean
  data?: any
  error?: string
  timestamp: Date
  duration: number
}

export interface WorkflowExecution {
  workflowId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  results: ExecutionResult[]
  totalDuration?: number
}