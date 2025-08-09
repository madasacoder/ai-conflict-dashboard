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
import { sanitizeWorkflowImport } from '@/utils/sanitize'
import { WorkflowExecution } from '@/types/workflow'
import { ExecutionProgress, workflowExecutor } from '@/services/workflowExecutor'
import toast from 'react-hot-toast'

// Custom node types
export type NodeType = 'llm' | 'compare' | 'output' | 'input' | 'summarize'

// Node data interfaces
export interface BaseNodeData {
  label: string
  description?: string
  isConfigured: boolean
  icon?: string
  color?: string
}

export interface LLMNodeData extends BaseNodeData {
  models?: string[]
  prompt?: string
  temperature?: number
  maxTokens?: number
}

export interface CompareNodeData extends BaseNodeData {
  comparisonType?: 'conflicts' | 'consensus' | 'differences'
  highlightLevel?: 'basic' | 'detailed'
}

export interface OutputNodeData extends BaseNodeData {
  format?: 'json' | 'markdown' | 'text'
  includeMetadata?: boolean
}

export interface InputNodeData extends BaseNodeData {
  inputType?: string
  placeholder?: string
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
  selectedNode: CustomNode | null
  isConfigPanelOpen: boolean
  isPaletteOpen: boolean
  currentTheme: 'light' | 'dark'
  isExecuting: boolean
  executionProgress: ExecutionProgress | null
  execution: WorkflowExecution | null
  isExecutionPanelOpen: boolean
  nodeExecutionStatus: Record<string, 'pending' | 'running' | 'completed' | 'error'>
  
  // Templates and history
  templates: WorkflowMetadata[]
  recentWorkflows: WorkflowMetadata[]
  
  // Actions for nodes and edges
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  
  // Node management
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  // Support both signatures for backward-compatibility with tests
  updateNodeData: {
    (nodeId: string, patch: Record<string, any>): void
    (nodeId: string, key: string, value: any): void
  }
  updateNode: (nodeId: string, patch: Record<string, any>) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
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
  executeWorkflow: () => Promise<any>
  reset: () => void
  stopExecution: () => void
  
  // UI state management
  selectNode: (nodeId: string | null) => void
  setSelectedNode: (node: CustomNode | null) => void
  toggleConfigPanel: () => void
  togglePalette: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setExecutionProgress: (progress: ExecutionProgress | null) => void
  setExecution: (execution: WorkflowExecution | null) => void
  toggleExecutionPanel: () => void
  setExecutionPanelOpen: (isOpen: boolean) => void
  setNodeExecutionStatus: (nodeId: string, status: 'pending' | 'running' | 'completed' | 'error') => void
  resetNodeExecutionStatuses: () => void
  getNodeExecutionStatus: (nodeId: string) => 'pending' | 'running' | 'completed' | 'error'
  
  // Utility functions
  validateWorkflow: () => { isValid: boolean; errors: string[] }
  exportWorkflow: () => string
  importWorkflow: (workflowJson: string) => void
  
  // Auto-save
  enableAutoSave: () => void
  disableAutoSave: () => void
  autoSave?: boolean
  autoSaveInterval?: number
  isAutoSaving?: boolean
  workflows?: WorkflowMetadata[]
}

// Generate unique IDs
const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Debounce helper
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T> | null = null
  
  return (...args: Parameters<T>) => {
    lastArgs = args
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs)
      }
      timeoutId = null
      lastArgs = null
    }, delay)
  }
}

// Node creation queue to prevent race conditions
class NodeCreationQueue {
  private queue: Array<() => void> = []
  private processing = false
  
  async add(operation: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(() => {
        operation()
        resolve()
      })
      this.process()
    })
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift()
      if (operation) {
        operation()
        // Small delay between operations to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    this.processing = false
  }
}

const nodeCreationQueue = new NodeCreationQueue()

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
    nodes: (savedState.nodes || []) as CustomNode[],
    edges: (savedState.edges || []) as Edge[],
    workflow: (savedState.workflow ?? null) as WorkflowMetadata | null,
    currentTheme: theme,
    isPaletteOpen: paletteOpen
  }
}

// Default templates
const getDefaultTemplates = (): WorkflowMetadata[] => {
  const savedTemplates = LocalStorage.get(STORAGE_KEYS.WORKFLOW_TEMPLATES, { defaultValue: [] })
  
  // Check if we already have the Multi-Model Comparison template
  const templates = Array.isArray(savedTemplates) ? savedTemplates : []
  const hasMultiModelTemplate = templates.some((t: any) => 
    t.name === 'Multi-Model Comparison'
  )
  
  if (!hasMultiModelTemplate) {
    const multiModelTemplate: WorkflowMetadata = {
      id: 'template_multi_model',
      name: 'Multi-Model Comparison',
      description: 'Compare responses from multiple AI models for the same prompt',
      icon: '🔍',
      color: '#3498db',
      tags: ['comparison', 'analysis', 'multi-model'],
      created: new Date(),
      modified: new Date(),
      isTemplate: true
    }
    templates.push(multiModelTemplate)
    LocalStorage.set(STORAGE_KEYS.WORKFLOW_TEMPLATES, templates)
  }
  
  return templates as WorkflowMetadata[]
}

// Create the store
export const useWorkflowStore = create<WorkflowState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state with localStorage
    ...loadInitialState(),
    selectedNode: null,
    isConfigPanelOpen: false,
    isExecuting: false,
    executionProgress: null,
    execution: null,
    isExecutionPanelOpen: false,
    nodeExecutionStatus: {},
    autoSave: false,
    autoSaveInterval: 30000,
    isAutoSaving: false,
    workflows: [],
    templates: getDefaultTemplates(),
    recentWorkflows: LocalStorage.get(STORAGE_KEYS.RECENT_WORKFLOWS, { defaultValue: [] }) || [],
    
    // React Flow handlers
    onNodesChange: (changes: NodeChange[]) => {
      set(state => {
        let newNodes = applyNodeChanges(changes, state.nodes as any) as any as CustomNode[]
        
        // Handle selection changes - ensure only one node is selected
        const hasSelectionChange = changes.some(change => change.type === 'select')
        if (hasSelectionChange) {
          const selectedChange = changes.find(change => change.type === 'select' && (change as any).selected)
          if (selectedChange) {
            // Deselect all nodes except the newly selected one
            newNodes = newNodes.map(node => ({
              ...node,
              selected: node.id === (selectedChange as any).id
            }))
          }
        }
        
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
      console.log('onConnect called with:', connection)
      set(state => {
        const newEdges = addEdge(connection, state.edges)
        console.log('New edges:', newEdges)
        // Save to localStorage
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_EDGES, newEdges)
        return { edges: newEdges }
      })
    },
    
    // Node management - with queue to prevent race conditions
    addNode: async (type: NodeType, position: { x: number; y: number }) => {
      await nodeCreationQueue.add(() => {
        try {
          console.log('addNode called with:', { type, position })
          
          // Validate inputs
          if (!type || typeof type !== 'string') {
            console.error('addNode: Invalid node type provided:', type)
            return
          }
          
          if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
            console.error('addNode: Invalid position provided:', position)
            return
          }
          
          // Validate position coordinates
          if (isNaN(position.x) || isNaN(position.y)) {
            console.error('addNode: Position contains NaN values:', position)
            return
          }
          
          const newNode: CustomNode = {
            id: generateId(),
            type,
            position,
            selected: true,  // Mark as selected for React Flow
            data: createDefaultNodeData(type, `${String(type).charAt(0).toUpperCase() + String(type).slice(1)} Node`)
          }
          
          console.log('Created newNode:', newNode)
          
          // Deselect all existing nodes first
          set(state => ({
            nodes: state.nodes.map(node => ({
              ...node,
              selected: false
            }))
          }))
          
          // Add the new node with selection
          set(state => ({
            nodes: [...state.nodes, newNode],
            selectedNode: newNode,
            isConfigPanelOpen: true
          }))
          
          // Update other state that doesn't go through React Flow
          set(state => {
            try {
              // Auto-create default workflow if none exists
              let currentWorkflow = state.workflow
              if (!currentWorkflow) {
                currentWorkflow = {
                  id: generateId(),
                  name: 'Untitled Workflow',
                  description: 'Auto-created workflow',
                  icon: '🔄',
                  color: '#3498db',
                  tags: [],
                  created: new Date(),
                  modified: new Date(),
                  isTemplate: false
                }
              }
              
              // Save workflow with nodes
              if (currentWorkflow) {
                try {
                  WorkflowStorage.saveWorkflow(currentWorkflow, [...state.nodes, newNode], state.edges)
                } catch (error) {
                  console.error('addNode: Failed to save workflow:', error)
                }
              }
              
              return {
                workflow: currentWorkflow,
                selectedNode: newNode,
                isConfigPanelOpen: true
              }
            } catch (error) {
              console.error('addNode: Failed to update workflow state:', error)
              return {
                selectedNode: newNode,
                isConfigPanelOpen: true
              }
            }
          })
          
          console.log('addNode: Successfully created node:', newNode.id)
        } catch (error) {
          console.error('addNode: Unexpected error:', error)
          // Don't throw - we want to handle errors gracefully
        }
      })
    },
    
    updateNodeData: ((nodeId: string, arg2: any, arg3?: any) => {
      set(state => {
        const patch: Record<string, any> = typeof arg2 === 'string' ? { [arg2]: arg3 } : (arg2 || {})
        const newNodes = state.nodes.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...patch, isConfigured: true } }
            : node
        )
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, newNodes)
        const updatedSelectedNode = state.selectedNode?.id === nodeId 
          ? newNodes.find(n => n.id === nodeId) || null
          : state.selectedNode
        return { nodes: newNodes, selectedNode: updatedSelectedNode }
      })
    }) as any,

    updateNode: (nodeId: string, patch: Record<string, any>) => {
      set(state => {
        const newNodes = state.nodes.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...patch } }
            : node
        )
        LocalStorage.set(STORAGE_KEYS.WORKFLOW_NODES, newNodes)
        return { nodes: newNodes }
      })
    },
    
    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
      set(state => {
        const newNodes = state.nodes.map(node =>
          node.id === nodeId
            ? { ...node, position }
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
        selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
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
        
        // Show success notification
        toast.success('Workflow saved!')
      } catch (error) {
        console.error('Failed to save workflow:', error)
        toast.error('Failed to save workflow')
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
      
      if (!state.workflow) {
        toast.error('No workflow selected')
        throw new Error('No workflow selected')
      }
      
      set({ 
        isExecuting: true, 
        executionProgress: null,
        nodeExecutionStatus: {},
        isExecutionPanelOpen: true 
      })
      
      try {
        // Reset all node statuses
        state.nodes.forEach(node => {
          set(state => ({
            nodeExecutionStatus: {
              ...state.nodeExecutionStatus,
              [node.id]: 'pending'
            }
          }))
        })
        
        // Execute using the new executor service
        const result = await workflowExecutor.executeWorkflow(
          state.nodes,
          state.edges,
          (progress) => {
            // Update progress in store
            set(state => ({
              executionProgress: progress,
              nodeExecutionStatus: {
                ...state.nodeExecutionStatus,
                [progress.nodeId]: progress.status
              }
            }))
            
            // Show toast notifications for important events
            if (progress.status === 'error') {
              toast.error(`Error in ${progress.message}`)
            } else if (progress.status === 'completed') {
              toast.success(`Completed: ${progress.message}`)
            }
          }
        )
        
        // Store results for display
        set({ 
          executionProgress: null,
          execution: {
            workflowId: state.workflow?.id || result.workflowId,
            status: result.status === 'success' ? 'completed' : 'failed',
            results: result.results,
            startTime: new Date(Date.now() - result.executionTime),
            endTime: new Date(),
            errors: result.errors
          },
          isExecutionPanelOpen: true
        })
        
        // Show final status
        if (result.status === 'success') {
          toast.success('Workflow executed successfully!')
        } else if (result.status === 'partial') {
          toast((t) => 'Workflow completed with some errors')
        } else {
          toast.error('Workflow execution failed')
        }
        
        return result
      } catch (error) {
        console.error('Workflow execution failed:', error)
        toast.error(error instanceof Error ? error.message : 'Workflow execution failed')
        
        set({
          execution: {
            workflowId: state.workflow?.id || 'unknown',
            status: 'failed',
            results: [],
            startTime: new Date(),
            endTime: new Date(),
            errors: [error instanceof Error ? error.message : 'Unknown error']
          }
        })
        
        throw error
      } finally {
        set({ isExecuting: false, executionProgress: null })
      }
    },
    
    stopExecution: () => {
      set({ isExecuting: false, executionProgress: null })
    },

    reset: () => {
      set({
        nodes: [],
        edges: [],
        selectedNode: null,
        isConfigPanelOpen: false,
        isExecuting: false,
        executionProgress: null,
        execution: null,
        nodeExecutionStatus: {}
      })
    },
    
    // UI state management
    selectNode: (nodeId: string | null) => {
      const node = nodeId ? get().nodes.find(n => n.id === nodeId) || null : null
      set({ 
        selectedNode: node,
        isConfigPanelOpen: nodeId !== null
      })
    },
    
    setSelectedNode: (node: CustomNode | null) => {
      set({ 
        selectedNode: node,
        isConfigPanelOpen: node !== null
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
    
    setExecutionProgress: (progress: ExecutionProgress | null) => {
      set({ executionProgress: progress })
    },
    
    setExecution: (execution: WorkflowExecution | null) => {
      set({ execution })
    },
    
    toggleExecutionPanel: () => {
      set(state => ({ isExecutionPanelOpen: !state.isExecutionPanelOpen }))
    },
    
    setExecutionPanelOpen: (isOpen: boolean) => {
      set({ isExecutionPanelOpen: isOpen })
    },
    
    setNodeExecutionStatus: (nodeId: string, status: 'pending' | 'running' | 'completed' | 'error') => {
      set(state => ({
        nodeExecutionStatus: {
          ...state.nodeExecutionStatus,
          [nodeId]: status
        }
      }))
    },
    
    resetNodeExecutionStatuses: () => {
      set({ nodeExecutionStatus: {} })
    },
    
    getNodeExecutionStatus: (nodeId: string) => {
      const state = get()
      return state.nodeExecutionStatus[nodeId] || 'pending'
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
        if (!sanitized.workflow?.id) {
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
      set({ autoSave: true, autoSaveInterval: 30000, isAutoSaving: false })
    },
    
    disableAutoSave: () => {
      set({ autoSave: false, isAutoSaving: false })
    }
  }))
)

// Selectors for common patterns
export const useWorkflowNodes = () => useWorkflowStore(state => state.nodes)
export const useWorkflowEdges = () => useWorkflowStore(state => state.edges)
export const useSelectedNode = () => useWorkflowStore(state => state.selectedNode)
export const useCurrentWorkflow = () => useWorkflowStore(state => state.workflow)
export const useIsExecuting = () => useWorkflowStore(state => state.isExecuting)

// Expose store to window for testing
if (typeof window !== 'undefined') {
  (window as any).workflowStore = useWorkflowStore
}