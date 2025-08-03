/**
 * Ollama Integration E2E Test - Desktop App
 * Migrated from web app workflow-builder-ollama.spec.js
 * 
 * Tests Ollama local model integration in the workflow builder
 */

import { test, expect } from '@playwright/experimental-ct-react'
import { WorkflowBuilder } from '../../components/WorkflowBuilder'
import { DesktopWorkflowFramework } from '../helpers/DesktopWorkflowFramework'

test.describe('Desktop Workflow Builder - Ollama Integration', () => {
  let framework: DesktopWorkflowFramework

  test.beforeEach(async ({ mount, page }) => {
    framework = new DesktopWorkflowFramework(page, mount)
    await framework.initialize()
  })

  test('should display Ollama models correctly in dropdown', async ({ page }) => {
    // Create an LLM node
    const llmNode = await framework.createLLMNode({
      model: 'gpt-4',
      prompt: 'Test prompt',
      position: { x: 300, y: 200 }
    })

    // Double-click to open configuration
    await page.locator(`[data-id="${llmNode.id}"]`).dblclick()
    await expect(page.locator('[data-testid="node-config-modal"]')).toBeVisible()

    // Select Ollama from the model dropdown
    const modelSelect = page.locator('[data-testid="model-select"]')
    await modelSelect.selectOption('ollama')

    // Mock Ollama models response
    await page.route('**/api/ollama/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: true,
          models: [
            { name: 'llama2:7b', size: 3.8 },
            { name: 'mistral:7b', size: 4.1 },
            { name: 'gemma:2b', size: 1.4 }
          ]
        })
      })
    })

    // Save to trigger model list refresh
    await page.click('[data-testid="save-config"]')
    
    // Re-open configuration
    await page.locator(`[data-id="${llmNode.id}"]`).dblclick()
    await expect(page.locator('[data-testid="node-config-modal"]')).toBeVisible()

    // Check that Ollama is still selected
    await expect(modelSelect).toHaveValue('ollama')

    // Verify no [object Object] in the UI
    const modalContent = await page.locator('[data-testid="node-config-modal"]').textContent()
    expect(modalContent).not.toContain('[object Object]')
    expect(modalContent).not.toContain('object Object')
  })

  test('should handle Ollama service not running gracefully', async ({ page }) => {
    // Mock Ollama service being down
    await page.route('**/api/ollama/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: false,
          models: [],
          error: 'Ollama service not running'
        })
      })
    })

    // Create an LLM node
    const llmNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Test prompt',
      position: { x: 300, y: 200 }
    })

    // Try to execute workflow
    const results = await framework.executeWorkflow()

    // Should handle error gracefully
    if (results.error) {
      expect(results.error).toContain('Ollama')
      console.log('✅ Ollama service down handled gracefully:', results.error)
    }

    // Node should show error state
    await expect(page.locator(`[data-id="${llmNode.id}"].error`)).toBeVisible({ timeout: 5000 })
  })

  test('should execute workflow with Ollama model', async ({ page }) => {
    console.log('🦙 Testing Ollama workflow execution...')

    // Mock successful Ollama API response
    await page.route('**/api/workflow/execute', async (route) => {
      const request = route.request()
      const body = await request.postDataJSON()
      
      // Check if Ollama model is being used
      const hasOllamaNode = body.nodes?.some((node: any) => 
        node.type === 'llm' && node.data.models?.includes('ollama')
      )

      if (hasOllamaNode) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nodes: {
              [body.nodes[0].id]: {
                status: 'completed',
                output: 'Ollama response: This is a test response from the local Ollama model.'
              },
              [body.nodes[1].id]: {
                status: 'completed',
                output: {
                  ollama: 'Local model processed: ' + body.nodes[0].data.value
                }
              }
            },
            status: 'completed'
          })
        })
      } else {
        await route.continue()
      }
    })

    // Create a simple workflow with Ollama
    const inputNode = await framework.createInputNode({
      type: 'text',
      content: 'Test input for Ollama',
      position: { x: 100, y: 200 }
    })

    const ollamaNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Process this text: {input}',
      position: { x: 400, y: 200 }
    })

    // Connect nodes
    await framework.connectNodes(inputNode.id, ollamaNode.id)

    // Execute workflow
    const results = await framework.executeWorkflow()

    // Verify execution completed
    expect(results.status).toBe('completed')
    
    if (results.nodes?.[ollamaNode.id]?.output) {
      console.log('✅ Ollama Output:', results.nodes[ollamaNode.id].output)
      expect(results.nodes[ollamaNode.id].output).toContain('Ollama')
    }
  })

  test('should save and load Ollama configuration correctly', async ({ page }) => {
    // Create node with Ollama
    const ollamaNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Saved Ollama prompt: {input}',
      position: { x: 300, y: 200 }
    })

    // Save workflow
    await page.click('[data-testid="save-workflow"]')
    await page.fill('[data-testid="workflow-name-input"]', 'Ollama Test Workflow')
    await page.click('[data-testid="confirm-save"]')

    // Clear workflow
    await framework.clearWorkflow()

    // Load saved workflow
    await page.click('[data-testid="load-workflow"]')
    await page.click('[data-testid="workflow-item-Ollama Test Workflow"]')

    // Verify Ollama configuration was preserved
    const loadedNode = await page.locator('.react-flow__node-llm').first()
    await loadedNode.dblclick()

    const modelSelect = page.locator('[data-testid="model-select"]')
    await expect(modelSelect).toHaveValue('ollama')

    const promptInput = page.locator('[data-testid="prompt-input"]')
    await expect(promptInput).toHaveValue('Saved Ollama prompt: {input}')
  })

  test('should switch between cloud and local models seamlessly', async ({ page }) => {
    // Create LLM node
    const llmNode = await framework.createLLMNode({
      model: 'gpt-4',
      prompt: 'Initial prompt',
      position: { x: 300, y: 200 }
    })

    // Open config and switch to Ollama
    await page.locator(`[data-id="${llmNode.id}"]`).dblclick()
    const modelSelect = page.locator('[data-testid="model-select"]')
    
    // Verify initial model
    await expect(modelSelect).toHaveValue('gpt-4')
    
    // Switch to Ollama
    await modelSelect.selectOption('ollama')
    await page.click('[data-testid="save-config"]')
    
    // Re-open and verify
    await page.locator(`[data-id="${llmNode.id}"]`).dblclick()
    await expect(modelSelect).toHaveValue('ollama')
    
    // Switch back to cloud model
    await modelSelect.selectOption('claude-3-opus')
    await page.click('[data-testid="save-config"]')
    
    // Final verification
    await page.locator(`[data-id="${llmNode.id}"]`).dblclick()
    await expect(modelSelect).toHaveValue('claude-3-opus')
  })

  test('should show appropriate UI feedback for Ollama operations', async ({ page }) => {
    // Create Ollama workflow
    const inputNode = await framework.createInputNode({
      type: 'text',
      content: 'Test',
      position: { x: 100, y: 200 }
    })

    const ollamaNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Process: {input}',
      position: { x: 400, y: 200 }
    })

    await framework.connectNodes(inputNode.id, ollamaNode.id)

    // Mock slow Ollama response
    await page.route('**/api/workflow/execute', async (route) => {
      // Delay to simulate slow local processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: {
            [ollamaNode.id]: {
              status: 'completed',
              output: 'Processed by local Ollama model'
            }
          },
          status: 'completed'
        })
      })
    })

    // Start execution
    await page.click('[data-testid="execute-workflow"]')

    // Should show executing status
    await expect(page.locator('[data-testid="execution-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="execution-status"]')).toContainText('executing')

    // Should show progress
    const progressBar = page.locator('.progress-bar')
    await expect(progressBar).toBeVisible()

    // Wait for completion
    await expect(page.locator('[data-testid="execution-complete"]')).toBeVisible({ timeout: 10000 })

    // Node should show success state
    await expect(page.locator(`[data-id="${ollamaNode.id}"].execution-success`)).toBeVisible()
  })
})