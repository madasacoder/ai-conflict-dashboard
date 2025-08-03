/**
 * Workflow State Management with Zustand
 * 
 * Clean, type-safe state management for the workflow builder.
 * Handles nodes, edges, and workflow metadata.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  Node, 
  Edge, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection
} from 'reactflow'
import { LocalStorage, STORAGE_KEYS, WorkflowStorage, UIStorage } from '@/utils/localStorage'
import { sanitizeNodeData, sanitizeWorkflowImport } from '@/utils/sanitize'

// Custom node types
export type NodeType = 'llm' | 'compare' | 'output' | 'input' | 'summarize'

// Node data interfaces
export interface BaseNodeData {
  label: string
  description?: string
  isConfigured: boolean
}

export interface LLMNodeData extends BaseNodeData {
  models: string[]
  prompt: string
  temperature: number
  maxTokens: number
}

export interface CompareNodeData extends BaseNodeData {
  comparisonType: 'conflicts' | 'consensus' | 'differences'
  highlightLevel: 'basic' | 'detailed'
}

export interface OutputNodeData extends BaseNodeData {
  format: 'json' | 'markdown' | 'text'
  includeMetadata: boolean
}

export interface InputNodeData extends BaseNodeData {
  inputType: 'text' | 'file' | 'url'
  placeholder: string
}

export interface SummarizeNodeData extends BaseNodeData {
  length: 'short' | 'medium' | 'long'
  style: 'bullets' | 'paragraph' | 'technical'
}

export type CustomNodeData = 
  | LLMNodeData 
  | CompareNodeData 
  | OutputNodeData 
  | InputNodeData 
  | SummarizeNodeData

export interface CustomNode extends Node {
  type: NodeType
  data: CustomNodeData
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

// Workflow state interface
interface WorkflowState {
  // Core React Flow state
  nodes: CustomNode[]
  edges: Edge[]
  
  // Workflow metadata
  workflow: WorkflowMetadata | null
  
  // UI state
  selectedNode: string | null
  isConfigPanelOpen: boolean
  isPaletteOpen: boolean
  currentTheme: 'light' | 'dark'
  isExecuting: boolean
  executionProgress: number
  
  // Templates and history
  templates: WorkflowMetadata[]
  recentWorkflows: WorkflowMetadata[]
  
  // Actions for nodes and edges
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  
  // Node management
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<CustomNodeData>) => void
  removeNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  
  // Edge management
  removeEdge: (edgeId: string) => void
  
  // Workflow management
  createNewWorkflow: (name: string, description?: string) => void
  loadWorkflow: (workflowId: string) => Promise<void>
  saveWorkflow: () => Promise<void>
  duplicateWorkflow: () => void
  deleteWorkflow: (workflowId: string) => void
  
  // Template management
  saveAsTemplate: () => void
  loadTemplate: (templateId: string) => void
  
  // Execution
  executeWorkflow: () => Promise<void>
  stopExecution: () => void
  
  // UI state management
  selectNode: (nodeId: string | null) => void
  toggleConfigPanel: () => void
  togglePalette: () => void
  setTheme: (theme: 'light' | 'dark') => void
  
  // Utility functions
  validateWorkflow: () => { isValid: boolean; errors: string[] }
  exportWorkflow: () => string
  importWorkflow: (workflowJson: string) => void
  
  // Auto-save
  enableAutoSave: () => void
  disableAutoSave: () => void
}

// Generate unique IDs
const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Default node data generators
const createDefaultNodeData = (type: NodeType, label: string): CustomNodeData => {
  const base: BaseNodeData = {
    label,
    isConfigured: false
  }
  
  switch (type) {
    case 'llm':
      return {
        ...base,
        models: ['gpt-4'],
        prompt: 'Analyze the following text:\n\n{input}',
        temperature: 0.5,
        maxTokens: 2000
      } as LLMNodeData
      
    case 'compare':
      return {
        ...base,
        comparisonType: 'conflicts',
        highlightLevel: 'basic'
      } as CompareNodeData
      
    case 'output':
      return {
        ...base,
        format: 'markdown',
        includeMetadata: false
      } as OutputNodeData
      
    case 'input':
      return {
        ...base,
        inputType: 'text',
        placeholder: 'Enter your text here...'
      } as InputNodeData
      
    case 'summarize':
      return {
        ...base,
        length: 'medium',
        style: 'paragraph'
      } as SummarizeNodeData
      
    default:
      return base as CustomNodeData
  }
}

// Load initial state from localStorage
const loadInitialState = () => {
  const savedState = WorkflowStorage.loadWorkflow()
  const theme = UIStorage.loadTheme()
  const paletteOpen = UIStorage.loadPaletteState()
  
  return {
    nodes: savedState.nodes || [],
    edges: savedState.edges || [],
    workflow: savedState.workflow || null,
    currentTheme: theme,
    isPaletteOpen: paletteOpen
  }
}

// Create the store
export const useWorkflowStore = create<WorkflowState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state with localStorage
    ...loadInitialState(),
    selectedNode: null,
    isConfigPanelOpen: false,
    isExecuting: false,
    executionProgress: 0,
    templates: LocalStorage.get(STORAGE_KEYS.WORKFLOW_TEMPLATES, { defaultValue: [] }),
    recentWorkflows: LocalStorage.get(STORAGE_KEYS.RECENT_WORKFLOWS, { defaultValue: [] }),
    
    // React Flow handlers
    onNodesChange: (changes: NodeChange[]) => {
      set(state => {
        const newNodes = applyNodeChanges(changes, state.nodes)
        // Save to localStorage
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, newNodes)
        return { nodes: newNodes }
      })
    },
    
    onEdgesChange: (changes: EdgeChange[]) => {
      set(state => {
        const newEdges = applyEdgeChanges(changes, state.edges)
        // Save to localStorage
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_EDGES, newEdges)
        return { edges: newEdges }
      })
    },
    
    onConnect: (connection: Connection) => {
      set(state => ({
        edges: addEdge(connection, state.edges)
      }))
    },
    
    // Node management
    addNode: (type: NodeType, position: { x: number; y: number }) => {
      const newNode: CustomNode = {
        id: generateId(),
        type,
        position,
        data: createDefaultNodeData(type, `${type.charAt(0).toUpperCase() + type.slice(1)} Node`)
      }
      
      set(state => {
        const newNodes = [...state.nodes, newNode]
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, newNodes)
        return {
          nodes: newNodes,
          selectedNode: newNode.id,
          isConfigPanelOpen: true
        }
      })
    },
    
    updateNodeData: (nodeId: string, data: Partial<CustomNodeData>) => {
      // Sanitize input data
      const sanitizedData = sanitizeNodeData(data)
      
      set(state => {
        const newNodes = state.nodes.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...sanitizedData, isConfigured: true } }
            : node
        )
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, newNodes)
        return { nodes: newNodes }
      })
    },
    
    removeNode: (nodeId: string) => {
      set(state => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => 
          edge.source !== nodeId && edge.target !== nodeId
        ),
        selectedNode: state.selectedNode === nodeId ? null : state.selectedNode
      }))
    },
    
    duplicateNode: (nodeId: string) => {
      const node = get().nodes.find(n => n.id === nodeId)
      if (!node) return
      
      const newNode: CustomNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        data: {
          ...node.data,
          label: `${node.data.label} (Copy)`
        }
      }
      
      set(state => ({
        nodes: [...state.nodes, newNode]
      }))
    },
    
    // Edge management
    removeEdge: (edgeId: string) => {
      set(state => ({
        edges: state.edges.filter(edge => edge.id !== edgeId)
      }))
    },
    
    // Workflow management
    createNewWorkflow: (name: string, description = '') => {
      const newWorkflow: WorkflowMetadata = {
        id: generateId(),
        name,
        description,
        icon: '🔄',
        color: '#3498db',
        tags: [],
        created: new Date(),
        modified: new Date(),
        isTemplate: false
      }
      
      set({
        workflow: newWorkflow,
        nodes: [],
        edges: [],
        selectedNode: null
      })
      
      // Save to localStorage
      WorkflowStorage.saveWorkflow(newWorkflow, [], [])
    },
    
    loadWorkflow: async (workflowId: string) => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`)
        const data = await response.json()
        
        set({
          workflow: data.workflow,
          nodes: data.nodes || [],
          edges: data.edges || []
        })
      } catch (error) {
        console.error('Failed to load workflow:', error)
      }
    },
    
    saveWorkflow: async () => {
      const state = get()
      if (!state.workflow) return
      
      try {
        const payload = {
          workflow: state.workflow,
          nodes: state.nodes,
          edges: state.edges
        }
        
        await fetch(`/api/workflows/${state.workflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        // Update modified time
        set(state => ({
          workflow: state.workflow ? {
            ...state.workflow,
            modified: new Date()
          } : null
        }))
      } catch (error) {
        console.error('Failed to save workflow:', error)
      }
    },
    
    duplicateWorkflow: () => {
      const state = get()
      if (!state.workflow) return
      
      const duplicated: WorkflowMetadata = {
        ...state.workflow,
        id: generateId(),
        name: `${state.workflow.name} (Copy)`,
        created: new Date(),
        modified: new Date()
      }
      
      set({ workflow: duplicated })
    },
    
    deleteWorkflow: async (workflowId: string) => {
      try {
        await fetch(`/api/workflows/${workflowId}`, {
          method: 'DELETE'
        })
        
        // If it's the current workflow, clear it
        const state = get()
        if (state.workflow?.id === workflowId) {
          set({
            workflow: null,
            nodes: [],
            edges: []
          })
        }
      } catch (error) {
        console.error('Failed to delete workflow:', error)
      }
    },
    
    // Template management
    saveAsTemplate: () => {
      const state = get()
      if (!state.workflow) return
      
      const template: WorkflowMetadata = {
        ...state.workflow,
        id: generateId(),
        name: `${state.workflow.name} Template`,
        isTemplate: true,
        created: new Date(),
        modified: new Date()
      }
      
      set(state => ({
        templates: [...state.templates, template]
      }))
    },
    
    loadTemplate: (templateId: string) => {
      const template = get().templates.find(t => t.id === templateId)
      if (!template) return
      
      const newWorkflow: WorkflowMetadata = {
        ...template,
        id: generateId(),
        name: template.name.replace(' Template', ''),
        isTemplate: false,
        created: new Date(),
        modified: new Date()
      }
      
      set({ workflow: newWorkflow })
    },
    
    // Execution
    executeWorkflow: async () => {
      const state = get()
      const validation = state.validateWorkflow()
      
      if (!validation.isValid) {
        console.error('Workflow validation failed:', validation.errors)
        throw new Error(validation.errors.join(', '))
      }
      
      if (!state.workflow) {
        throw new Error('No workflow selected')
      }
      
      set({ isExecuting: true, executionProgress: 0 })
      
      try {
        // Get API keys from localStorage
        const apiKeys = {
          openai: localStorage.getItem('openai_api_key') || '',
          claude: localStorage.getItem('claude_api_key') || '',
          gemini: localStorage.getItem('gemini_api_key') || '',
          grok: localStorage.getItem('grok_api_key') || ''
        }
        
        // Call backend API
        const response = await fetch(`http://localhost:8000/api/workflows/${state.workflow.id}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflow_id: state.workflow.id,
            nodes: state.nodes,
            edges: state.edges,
            api_keys: apiKeys
          })
        })
        
        if (!response.ok) {
          throw new Error(`Execution failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Workflow executed successfully:', result)
        
        // Store results for display
        set({ 
          executionProgress: 100,
          // Could store results in a new state property
        })
        
        return result
      } catch (error) {
        console.error('Workflow execution failed:', error)
        throw error
      } finally {
        set({ isExecuting: false, executionProgress: 0 })
      }
    },
    
    stopExecution: () => {
      set({ isExecuting: false, executionProgress: 0 })
    },
    
    // UI state management
    selectNode: (nodeId: string | null) => {
      set({ 
        selectedNode: nodeId,
        isConfigPanelOpen: nodeId !== null
      })
    },
    
    toggleConfigPanel: () => {
      set(state => ({ isConfigPanelOpen: !state.isConfigPanelOpen }))
    },
    
    togglePalette: () => {
      set(state => {
        const newState = !state.isPaletteOpen
        UIStorage.savePaletteState(newState)
        return { isPaletteOpen: newState }
      })
    },
    
    setTheme: (theme: 'light' | 'dark') => {
      UIStorage.saveTheme(theme)
      set({ currentTheme: theme })
    },
    
    // Utility functions
    validateWorkflow: () => {
      const state = get()
      const errors: string[] = []
      
      if (state.nodes.length === 0) {
        errors.push('Workflow must contain at least one node')
      }
      
      const inputNodes = state.nodes.filter(node => node.type === 'input')
      if (inputNodes.length === 0) {
        errors.push('Workflow must have at least one input node')
      }
      
      const outputNodes = state.nodes.filter(node => node.type === 'output')
      if (outputNodes.length === 0) {
        errors.push('Workflow must have at least one output node')
      }
      
      // Check for disconnected nodes
      const connectedNodes = new Set<string>()
      state.edges.forEach(edge => {
        connectedNodes.add(edge.source)
        connectedNodes.add(edge.target)
      })
      
      const disconnectedNodes = state.nodes.filter(node => 
        !connectedNodes.has(node.id) && state.nodes.length > 1
      )
      
      if (disconnectedNodes.length > 0) {
        errors.push(`${disconnectedNodes.length} nodes are not connected`)
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
    },
    
    exportWorkflow: () => {
      const state = get()
      return JSON.stringify({
        workflow: state.workflow,
        nodes: state.nodes,
        edges: state.edges,
        version: '1.0'
      }, null, 2)
    },
    
    importWorkflow: (workflowJson: string) => {
      try {
        const data = JSON.parse(workflowJson)
        
        // Validate and sanitize imported data
        const sanitized = sanitizeWorkflowImport(data)
        
        // Additional validation
        if (!sanitized.workflow || !sanitized.workflow.id) {
          throw new Error('Invalid workflow: missing required fields')
        }
        
        // Check for dangerous patterns
        if (sanitized.workflow.id.includes('..') || sanitized.workflow.id.includes('/')) {
          throw new Error('Invalid workflow ID')
        }
        
        set({
          workflow: sanitized.workflow,
          nodes: sanitized.nodes || [],
          edges: sanitized.edges || []
        })
        
        // Save to localStorage
        WorkflowStorage.saveWorkflow(
          sanitized.workflow,
          sanitized.nodes || [],
          sanitized.edges || []
        )
      } catch (error) {
        console.error('Failed to import workflow:', error)
        throw error
      }
    },
    
    // Auto-save (placeholder implementations)
    enableAutoSave: () => {
      // TODO: Implement auto-save with debouncing
      console.log('Auto-save enabled')
    },
    
    disableAutoSave: () => {
      console.log('Auto-save disabled')
    }
  }))
)

// Selectors for common patterns
export const useWorkflowNodes = () => useWorkflowStore(state => state.nodes)
export const useWorkflowEdges = () => useWorkflowStore(state => state.edges)
export const useSelectedNode = () => useWorkflowStore(state => state.selectedNode)
export const useCurrentWorkflow = () => useWorkflowStore(state => state.workflow)
export const useIsExecuting = () => useWorkflowStore(state => state.isExecuting)