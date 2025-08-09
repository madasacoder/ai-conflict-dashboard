/**
 * Common helper functions for workflow E2E tests
 * Provides consistent patterns for interacting with the workflow builder
 */

import { Page, Locator } from '@playwright/test'
import { dragNodeToCanvas } from './dragDrop'

/**
 * Launch the workflow builder from the home page
 */
export async function launchWorkflowBuilder(page: Page) {
  // Click the Launch button when it becomes enabled
  const launchButton = page.locator('button').filter({ hasText: /Launch Workflow Builder/i })
  await launchButton.waitFor({ state: 'visible' })
  await launchButton.click()
  
  // Wait for workflow builder to load
  await page.waitForSelector('[data-testid="workflow-builder"]', { timeout: 5000 })
  await page.waitForSelector('.node-palette', { timeout: 5000 })
}

/**
 * Create a new workflow using the toolbar menu
 */
export async function createNewWorkflow(page: Page, name: string, description?: string) {
  // Click the dropdown arrow next to workflow name/No Workflow
  const dropdownButton = page.locator('.workflow-menu-btn')
  await dropdownButton.click()
  
  // Click "New Workflow" in dropdown
  const newWorkflowButton = page.locator('.dropdown-item:has-text("New Workflow")')
  await newWorkflowButton.click()
  
  // Wait for modal to appear
  await page.waitForSelector('[data-testid="workflow-modal"]', { timeout: 5000 })
  
  // Fill in workflow details
  const nameInput = page.locator('input[name="workflowName"]')
  await nameInput.fill(name)
  
  if (description) {
    const descInput = page.locator('textarea[name="workflowDescription"]')
    await descInput.fill(description)
  }
  
  // Click Create button
  const createButton = page.locator('button:has-text("Create Workflow")')
  await createButton.click()
  
  // Wait for modal to close
  await page.waitForSelector('[data-testid="workflow-modal"]', { state: 'hidden', timeout: 5000 })
}

/**
 * Add a node to the canvas using our custom drag solution
 */
export async function addNodeToCanvas(
  page: Page, 
  nodeType: 'input' | 'llm' | 'compare' | 'output' | 'summarize',
  position: { x: number, y: number }
) {
  await dragNodeToCanvas(page, nodeType, position)
  
  // Wait for node to appear with proper test ID
  await page.waitForSelector(`[data-testid^="rf__node-"]`, { timeout: 5000 })
  
  // Small delay to ensure React Flow has processed the node
  await page.waitForTimeout(200)
}

/**
 * Connect two nodes by creating an edge between them
 */
export async function connectNodes(
  page: Page,
  sourceNodeIndex: number,
  targetNodeIndex: number
) {
  // Get all React Flow nodes (the actual selectable nodes)
  const nodes = page.locator('.react-flow__node')
  
  // Get source and target nodes
  const sourceNode = nodes.nth(sourceNodeIndex)
  const targetNode = nodes.nth(targetNodeIndex)
  
  // Find the source handle (output) on the source node
  const sourceHandle = sourceNode.locator('.react-flow__handle.source').first()
  
  // Find the target handle (input) on the target node  
  const targetHandle = targetNode.locator('.react-flow__handle.target').first()
  
  // Get handle positions
  const sourceBox = await sourceHandle.boundingBox()
  const targetBox = await targetHandle.boundingBox()
  
  if (!sourceBox || !targetBox) {
    throw new Error('Could not find handle positions')
  }
  
  // Simulate connection by dragging from source to target handle
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 })
  await page.mouse.up()
  
  // Wait for edge to appear
  await page.waitForSelector('.react-flow__edge', { timeout: 5000 })
}

/**
 * Configure a node by clicking it and filling in its configuration
 */
export async function configureNode(
  page: Page,
  nodeIndex: number,
  config: Record<string, any>
) {
  // Get the node
  const nodes = page.locator('[data-testid^="rf__node-"]')
  const node = nodes.nth(nodeIndex)
  
  // Click to select/expand it - use force to click even if overlapped
  await node.click({ force: true })
  
  // Wait for either inline config or config panel
  const hasInlineConfig = await node.locator('.node-config').isVisible().catch(() => false)
  const hasConfigPanel = await page.locator('[data-testid="node-config-panel"]').isVisible().catch(() => false)
  
  if (!hasInlineConfig && !hasConfigPanel) {
    // Try clicking the header to expand
    await node.locator('.node-header').click()
    await page.waitForTimeout(200)
  }
  
  // Configure based on node type and config
  if (config.text) {
    const textarea = hasInlineConfig 
      ? node.locator('textarea').first()
      : page.locator('textarea').first()
    await textarea.fill(config.text)
  }
  
  if (config.model) {
    const select = hasInlineConfig
      ? node.locator('select[name="model"]')
      : page.locator('select[name="model"]')
    if (await select.isVisible()) {
      await select.selectOption(config.model)
    }
  }
  
  if (config.prompt) {
    const promptArea = hasInlineConfig
      ? node.locator('textarea[name="prompt"]')
      : page.locator('textarea[name="prompt"]')
    if (await promptArea.isVisible()) {
      await promptArea.fill(config.prompt)
    }
  }
}

/**
 * Execute the workflow and wait for results
 */
export async function executeWorkflow(page: Page) {
  // Click execute button
  const executeButton = page.locator('[data-testid="execute-workflow"]')
  await executeButton.click()
  
  // Check if validation errors appear (workflow invalid)
  const toastErrors = page.locator('[aria-live="polite"]')
  const hasErrors = await toastErrors.count().then(count => count > 0)
  
  if (hasErrors) {
    // Return validation errors
    const errorTexts = await toastErrors.allTextContents()
    return { success: false, errors: errorTexts }
  }
  
  // Wait for execution to start (look for various indicators)
  const executionIndicators = [
    page.locator('[data-testid="execution-status"]'),
    page.locator('[data-testid="execution-panel"]'),
    page.locator('.execution-progress'),
    page.locator('text=/Executing|Running|Processing/i')
  ]
  
  // Check if any execution indicator appears
  let executionStarted = false
  for (const indicator of executionIndicators) {
    if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      executionStarted = true
      break
    }
  }
  
  if (!executionStarted) {
    return { success: false, errors: ['Execution did not start'] }
  }
  
  // Wait for execution to complete (look for completion indicators)
  const completionIndicators = [
    page.locator('[data-testid="execution-complete"]'),
    page.locator('text=/Completed|Finished|Done/i'),
    page.locator('.execution-results')
  ]
  
  let executionCompleted = false
  for (const indicator of completionIndicators) {
    if (await indicator.isVisible({ timeout: 30000 }).catch(() => false)) {
      executionCompleted = true
      break
    }
  }
  
  return { success: executionCompleted, errors: executionCompleted ? [] : ['Execution did not complete'] }
}

/**
 * Check if a workflow is valid (has required nodes and connections)
 */
export async function isWorkflowValid(page: Page): Promise<boolean> {
  // Get node count
  const nodes = await page.locator('[data-testid^="rf__node-"]').count()
  if (nodes === 0) return false
  
  // Check for at least one input and output node
  const inputNodes = await page.locator('.input-node').count()
  const outputNodes = await page.locator('.output-node').count()
  
  return inputNodes > 0 && outputNodes > 0
}

/**
 * Get validation errors when executing an invalid workflow
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
  // Click execute to trigger validation
  const executeButton = page.locator('[data-testid="execute-workflow"]')
  await executeButton.click()
  
  // Wait for toast errors
  await page.waitForTimeout(500)
  
  // Get all toast error messages
  const toastErrors = page.locator('[aria-live="polite"]')
  const errorTexts = await toastErrors.allTextContents()
  
  return errorTexts
}

/**
 * Save the current workflow
 */
export async function saveWorkflow(page: Page) {
  // Find save button (might be in toolbar)
  const saveButton = page.locator('button[aria-label*="Save"]')
  if (await saveButton.isVisible()) {
    await saveButton.click()
    
    // Wait for save confirmation (toast)
    await page.waitForSelector('text=/Saved|Workflow saved/i', { timeout: 5000 })
    return true
  }
  
  return false
}

/**
 * Load a workflow by name
 */
export async function loadWorkflow(page: Page, workflowName: string) {
  // Open workflow menu
  const dropdownButton = page.locator('.workflow-menu-btn')
  await dropdownButton.click()
  
  // Click "Open Workflow"
  const openButton = page.locator('.dropdown-item:has-text("Open Workflow")')
  await openButton.click()
  
  // Wait for modal
  await page.waitForSelector('[data-testid="workflow-modal"]', { timeout: 5000 })
  
  // Find and click the workflow
  const workflowItem = page.locator(`text="${workflowName}"`)
  await workflowItem.click()
  
  // Click Load/Open button
  const loadButton = page.locator('button:has-text("Load"), button:has-text("Open")')
  await loadButton.click()
  
  // Wait for modal to close
  await page.waitForSelector('[data-testid="workflow-modal"]', { state: 'hidden', timeout: 5000 })
}

/**
 * Toggle dark/light theme
 */
export async function toggleTheme(page: Page) {
  // Find theme toggle button
  const themeButton = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]')
  if (await themeButton.isVisible()) {
    await themeButton.click()
    return true
  }
  
  return false
}

/**
 * Open the execution panel to see results
 */
export async function openExecutionPanel(page: Page) {
  // Find execution panel toggle
  const panelButton = page.locator('button[aria-label*="execution panel"], button[aria-label*="Results"]')
  if (await panelButton.isVisible()) {
    await panelButton.click()
    
    // Wait for panel to appear
    await page.waitForSelector('[data-testid="execution-panel"]', { timeout: 5000 })
    return true
  }
  
  return false
}