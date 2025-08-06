/**
 * DesktopWorkflowFramework - Helper class for E2E testing of workflow builder
 * 
 * Provides high-level API for creating nodes, connecting them, and executing workflows
 * in the desktop app using React Flow.
 */

import { Page, Locator } from '@playwright/test'
import { ReactWrapper } from '@playwright/experimental-ct-react'

export interface NodeConfig {
  position?: { x: number; y: number }
}

export interface InputNodeConfig extends NodeConfig {
  type?: 'text' | 'file' | 'url'
  content?: string
  filePath?: string
  url?: string
}

export interface LLMNodeConfig extends NodeConfig {
  model: string
  prompt: string
  temperature?: number
}

export interface CompareNodeConfig extends NodeConfig {
  comparisonType?: 'conflicts' | 'consensus' | 'differences'
  highlightLevel?: 'minimal' | 'moderate' | 'detailed'
}

export interface NodeResult {
  id: string
  type: string
  index: number
}

export class DesktopWorkflowFramework {
  private component: ReactWrapper | null = null
  private nodeCounter = 0
  private nodeRegistry: Map<string, NodeResult> = new Map()

  constructor(
    private page: Page,
    private mount: (component: any, props?: any) => Promise<ReactWrapper>
  ) {}

  async initialize() {
    // Import WorkflowBuilder dynamically to avoid compilation issues
    const { WorkflowBuilder } = await import('../../components/WorkflowBuilder')
    this.component = await this.mount(WorkflowBuilder, {})
    await this.page.waitForSelector('.react-flow__renderer', { timeout: 10000 })
  }

  async createInputNode(config: InputNodeConfig): Promise<NodeResult> {
    // Click on input node in palette
    await this.component!.locator('[data-testid="node-palette-input"]').click()
    
    // Wait for node to appear
    const nodeSelector = `.react-flow__node-input:nth-child(${this.nodeCounter + 1})`
    await this.page.waitForSelector(nodeSelector)
    
    const node = await this.page.locator(nodeSelector)
    
    // Position the node if specified
    if (config.position) {
      await this.positionNode(node, config.position)
    }
    
    // Configure if needed
    if (config.content || config.filePath || config.url) {
      await node.dblclick()
      await this.page.waitForSelector('[data-testid="node-config-modal"]')
      
      // Select input type
      if (config.type) {
        await this.page.selectOption('[data-testid="input-type-select"]', config.type)
      }
      
      // Set content based on type
      if (config.type === 'text' && config.content) {
        await this.page.fill('[data-testid="input-content"]', config.content)
      } else if (config.type === 'file' && config.filePath) {
        await this.page.fill('[data-testid="input-file-path"]', config.filePath)
      } else if (config.type === 'url' && config.url) {
        await this.page.fill('[data-testid="input-url"]', config.url)
      }
      
      await this.page.click('[data-testid="save-config"]')
      await this.page.waitForSelector('[data-testid="node-config-modal"]', { state: 'hidden' })
    }
    
    const nodeId = await node.getAttribute('data-id') || `node-${this.nodeCounter}`
    const result: NodeResult = {
      id: nodeId,
      type: 'input',
      index: this.nodeCounter
    }
    
    this.nodeRegistry.set(nodeId, result)
    this.nodeCounter++
    
    return result
  }

  async createLLMNode(config: LLMNodeConfig): Promise<NodeResult> {
    await this.component!.locator('[data-testid="node-palette-llm"]').click()
    
    const nodeSelector = `.react-flow__node-llm:nth-child(${this.nodeCounter + 1})`
    await this.page.waitForSelector(nodeSelector)
    
    const node = await this.page.locator(nodeSelector)
    
    // Position the node
    if (config.position) {
      await this.positionNode(node, config.position)
    }
    
    // Configure
    await node.dblclick()
    await this.page.waitForSelector('[data-testid="node-config-modal"]')
    
    // Set prompt
    await this.page.fill('[data-testid="prompt-input"]', config.prompt)
    
    // Select model
    await this.page.selectOption('[data-testid="model-select"]', config.model)
    
    // Set temperature if specified
    if (config.temperature !== undefined) {
      await this.page.fill('[data-testid="temperature-input"]', config.temperature.toString())
    }
    
    await this.page.click('[data-testid="save-config"]')
    await this.page.waitForSelector('[data-testid="node-config-modal"]', { state: 'hidden' })
    
    const nodeId = await node.getAttribute('data-id') || `node-${this.nodeCounter}`
    const result: NodeResult = {
      id: nodeId,
      type: 'llm',
      index: this.nodeCounter
    }
    
    this.nodeRegistry.set(nodeId, result)
    this.nodeCounter++
    
    return result
  }

  async createCompareNode(config: CompareNodeConfig): Promise<NodeResult> {
    await this.component!.locator('[data-testid="node-palette-compare"]').click()
    
    const nodeSelector = `.react-flow__node-compare:nth-child(${this.nodeCounter + 1})`
    await this.page.waitForSelector(nodeSelector)
    
    const node = await this.page.locator(nodeSelector)
    
    // Position the node
    if (config.position) {
      await this.positionNode(node, config.position)
    }
    
    // Configure if needed
    if (config.comparisonType || config.highlightLevel) {
      await node.dblclick()
      await this.page.waitForSelector('[data-testid="node-config-modal"]')
      
      if (config.comparisonType) {
        await this.page.selectOption('[data-testid="comparison-type-select"]', config.comparisonType)
      }
      
      if (config.highlightLevel) {
        await this.page.selectOption('[data-testid="highlight-level-select"]', config.highlightLevel)
      }
      
      await this.page.click('[data-testid="save-config"]')
      await this.page.waitForSelector('[data-testid="node-config-modal"]', { state: 'hidden' })
    }
    
    const nodeId = await node.getAttribute('data-id') || `node-${this.nodeCounter}`
    const result: NodeResult = {
      id: nodeId,
      type: 'compare',
      index: this.nodeCounter
    }
    
    this.nodeRegistry.set(nodeId, result)
    this.nodeCounter++
    
    return result
  }

  async connectNodes(sourceId: string, targetId: string, targetHandle?: string) {
    // React Flow connection logic
    const sourceNode = await this.page.locator(`[data-id="${sourceId}"]`)
    const targetNode = await this.page.locator(`[data-id="${targetId}"]`)
    
    // Find the source handle (output)
    const sourceHandle = sourceNode.locator('.source-handle')
    
    // Find the target handle (input)
    const targetHandleSelector = targetHandle 
      ? `[data-handleid="${targetHandle}"]` 
      : '.target-handle'
    const handle = targetNode.locator(targetHandleSelector).first()
    
    // Drag from source to target
    await sourceHandle.dragTo(handle)
    
    // Wait for connection to be established
    await this.page.waitForTimeout(500) // React Flow needs time to process
  }

  async executeWorkflow(): Promise<any> {
    // Click execute button
    await this.component!.locator('[data-testid="execute-workflow"]').click()
    
    // Wait for execution to start
    await this.page.waitForSelector('[data-testid="execution-status"]')
    
    // Wait for execution to complete (with timeout for AI calls)
    await this.page.waitForSelector('[data-testid="execution-complete"]', {
      timeout: 60000 // 60 seconds for AI processing
    })
    
    // Get results from the store
    const results = await this.page.evaluate(() => {
      // Access the Zustand store
      const store = (window as any).workflowStore
      if (store) {
        const state = store.getState()
        return {
          nodes: state.executionResults,
          status: state.executionStatus,
          error: state.executionError
        }
      }
      return null
    })
    
    return results
  }

  async getNodeOutput(nodeId: string): Promise<any> {
    return await this.page.evaluate((id) => {
      const store = (window as any).workflowStore
      if (store) {
        const state = store.getState()
        return state.executionResults?.[id]
      }
      return null
    }, nodeId)
  }

  async removeNode(nodeId: string) {
    const node = await this.page.locator(`[data-id="${nodeId}"]`)
    await node.click()
    await this.page.keyboard.press('Delete')
    await this.page.waitForTimeout(300) // Wait for node removal
  }

  async clearWorkflow() {
    await this.page.keyboard.press('Control+a')
    await this.page.keyboard.press('Delete')
    await this.page.waitForTimeout(500)
    this.nodeCounter = 0
    this.nodeRegistry.clear()
  }

  private async positionNode(node: Locator, position: { x: number; y: number }) {
    // React Flow uses transform for positioning
    // We need to interact with the React Flow instance
    await this.page.evaluate(({ id, x, y }) => {
      const store = (window as any).workflowStore
      if (store) {
        const { updateNodePosition } = store.getState()
        updateNodePosition(id, { x, y })
      }
    }, {
      id: await node.getAttribute('data-id'),
      x: position.x,
      y: position.y
    })
  }
}