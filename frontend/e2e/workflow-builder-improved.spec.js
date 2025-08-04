/**
 * Improved E2E test for workflow builder with proper wait conditions
 * Demonstrates best practices for Playwright tests
 */
const { test, expect } = require('@playwright/test');

test.describe('Workflow Builder - Improved Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to workflow builder
    await page.goto('http://localhost:3000/workflow-builder.html');

    // Wait for specific element instead of arbitrary timeout
    await expect(page.locator('#drawflow')).toBeVisible();
    
    // Wait for initialization to complete
    await page.waitForFunction(() => {
      return window.editor && window.editor.drawflow && Object.keys(window.editor.drawflow).length > 0;
    });
  });

  test('should add and configure nodes without arbitrary waits', async ({ page }) => {
    // ✅ Good: Wait for specific element to be actionable
    const addNodeButton = page.locator('[data-node="input"]');
    await expect(addNodeButton).toBeEnabled();
    await addNodeButton.click();

    // ✅ Good: Wait for the node to appear with specific selector
    const inputNode = page.locator('.drawflow-node.input').first();
    await expect(inputNode).toBeVisible();

    // ✅ Good: Wait for node to be in correct position
    await expect(inputNode).toHaveCSS('position', 'absolute');
    
    // Configure the node
    const textInput = inputNode.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeEditable();
    await textInput.fill('Test input text');
    
    // ✅ Good: Verify the value was set
    await expect(textInput).toHaveValue('Test input text');

    // Add LLM node
    const llmNodeButton = page.locator('[data-node="llm"]');
    await expect(llmNodeButton).toBeEnabled();
    await llmNodeButton.click();

    // ✅ Good: Wait for second node with count assertion
    await expect(page.locator('.drawflow-node')).toHaveCount(2);
    
    const llmNode = page.locator('.drawflow-node.llm').first();
    await expect(llmNode).toBeVisible();
  });

  test('should connect nodes with proper wait conditions', async ({ page }) => {
    // Add two nodes first
    await page.locator('[data-node="input"]').click();
    await expect(page.locator('.drawflow-node.input')).toBeVisible();
    
    await page.locator('[data-node="output"]').click();
    await expect(page.locator('.drawflow-node.output')).toBeVisible();

    // Get connection points
    const outputPort = page.locator('.drawflow-node.input .output').first();
    const inputPort = page.locator('.drawflow-node.output .input').first();

    // ✅ Good: Wait for ports to be ready
    await expect(outputPort).toBeVisible();
    await expect(inputPort).toBeVisible();

    // Drag to connect
    await outputPort.dragTo(inputPort);

    // ✅ Good: Wait for connection line to appear
    await expect(page.locator('svg.connection')).toBeVisible();
    
    // ✅ Good: Verify connection was created in the data model
    const connectionCount = await page.evaluate(() => {
      return Object.keys(window.editor.drawflow.drawflow.Home.data).filter(
        key => window.editor.drawflow.drawflow.Home.data[key].class === 'connection'
      ).length;
    });
    expect(connectionCount).toBeGreaterThan(0);
  });

  test('should handle API responses with proper loading states', async ({ page }) => {
    // Mock API endpoint
    await page.route('**/api/analyze', async (route) => {
      // ✅ Good: Simulate realistic delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: 'Analysis complete',
          model: 'gpt-4'
        })
      });
    });

    // Add and configure node
    await page.locator('[data-node="llm"]').click();
    const llmNode = page.locator('.drawflow-node.llm').first();
    await expect(llmNode).toBeVisible();

    // Configure API key
    const apiKeyInput = llmNode.locator('input[type="password"], input[placeholder*="API"]').first();
    await apiKeyInput.fill('test-api-key');

    // Execute
    const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run")').first();
    await expect(executeButton).toBeEnabled();
    await executeButton.click();

    // ✅ Good: Wait for loading state
    await expect(page.locator('.loading, .spinner, [data-loading="true"]')).toBeVisible();
    
    // ✅ Good: Wait for loading to complete
    await expect(page.locator('.loading, .spinner, [data-loading="true"]')).toBeHidden({ timeout: 10000 });
    
    // ✅ Good: Wait for result
    await expect(page.locator('text=/Analysis complete/')).toBeVisible();
  });

  test('should validate workflow before execution', async ({ page }) => {
    // Try to execute empty workflow
    const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run")').first();
    
    // ✅ Good: Check button state
    if (await executeButton.isEnabled()) {
      await executeButton.click();
      
      // ✅ Good: Wait for validation error
      await expect(page.locator('.error, .validation-error, [role="alert"]')).toBeVisible();
      await expect(page.locator('text=/empty|no nodes|at least one/i')).toBeVisible();
    } else {
      // Button correctly disabled for empty workflow
      await expect(executeButton).toBeDisabled();
    }
  });

  test('should auto-save with debounce', async ({ page }) => {
    // Set up localStorage spy
    await page.evaluate(() => {
      window.saveCount = 0;
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'workflow' || key === 'currentWorkflow') {
          window.saveCount++;
        }
        return originalSetItem.call(this, key, value);
      };
    });

    // Make rapid changes
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-node="input"]').click();
      // ✅ Good: Small wait to simulate user interaction
      await page.waitForTimeout(100);
    }

    // ✅ Good: Wait for debounced save
    await page.waitForFunction(
      () => window.saveCount > 0,
      { timeout: 5000 }
    );

    // Verify debouncing worked (should be less than number of changes)
    const saveCount = await page.evaluate(() => window.saveCount);
    expect(saveCount).toBeGreaterThan(0);
    expect(saveCount).toBeLessThan(5);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort('failed'));

    // Add node and try to execute
    await page.locator('[data-node="llm"]').click();
    await expect(page.locator('.drawflow-node.llm')).toBeVisible();

    const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run")').first();
    if (await executeButton.isEnabled()) {
      await executeButton.click();

      // ✅ Good: Wait for error message
      await expect(page.locator('text=/error|failed|could not|unable/i')).toBeVisible({ timeout: 5000 });
      
      // ✅ Good: Verify app didn't crash
      await expect(page.locator('#drawflow')).toBeVisible();
      await expect(page.locator('[data-node="input"]')).toBeEnabled();
    }
  });

  test('should update node positions after drag', async ({ page }) => {
    // Add a node
    await page.locator('[data-node="input"]').click();
    const node = page.locator('.drawflow-node.input').first();
    await expect(node).toBeVisible();

    // Get initial position
    const initialPos = await node.boundingBox();
    expect(initialPos).toBeTruthy();

    // Drag the node
    await node.dragTo(node, {
      targetPosition: { x: 200, y: 200 }
    });

    // ✅ Good: Wait for position to update
    await page.waitForFunction(
      ([selector, oldX, oldY]) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return Math.abs(rect.x - oldX) > 10 || Math.abs(rect.y - oldY) > 10;
      },
      ['.drawflow-node.input', initialPos.x, initialPos.y]
    );

    // Verify position changed
    const newPos = await node.boundingBox();
    expect(newPos.x).not.toBe(initialPos.x);
    expect(newPos.y).not.toBe(initialPos.y);
  });

  test('should show real-time execution progress', async ({ page }) => {
    // Mock SSE endpoint for progress updates
    await page.route('**/api/execute/stream', async (route) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode('data: {"status": "starting"}\n\n'));
          await new Promise(r => setTimeout(r, 100));
          controller.enqueue(encoder.encode('data: {"status": "processing", "progress": 50}\n\n'));
          await new Promise(r => setTimeout(r, 100));
          controller.enqueue(encoder.encode('data: {"status": "complete", "progress": 100}\n\n'));
          controller.close();
        }
      });

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: stream
      });
    });

    // Execute workflow
    const executeButton = page.locator('button:has-text("Execute")').first();
    if (await executeButton.isEnabled()) {
      await executeButton.click();

      // ✅ Good: Wait for each progress state
      await expect(page.locator('text=/starting/i')).toBeVisible();
      await expect(page.locator('text=/processing|50%/i')).toBeVisible();
      await expect(page.locator('text=/complete|100%|done/i')).toBeVisible();
    }
  });
});

test.describe('Ollama Integration - Improved', () => {
  test('should load Ollama models without arbitrary waits', async ({ page }) => {
    await page.goto('http://localhost:3000/workflow-builder.html');
    await expect(page.locator('#drawflow')).toBeVisible();

    // Mock Ollama API
    await page.route('**/api/ollama/models', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: true,
          models: [
            { name: 'llama2:7b', size: 7516192768 },
            { name: 'codellama:13b', size: 13958643712 }
          ]
        })
      });
    });

    // Add LLM node
    await page.locator('[data-node="llm"]').click();
    const llmNode = page.locator('.drawflow-node.llm').first();
    await expect(llmNode).toBeVisible();

    // Select Ollama provider
    const providerSelect = llmNode.locator('select.provider-select, select[name="provider"]').first();
    await providerSelect.selectOption('ollama');

    // ✅ Good: Wait for models to load
    const modelSelect = llmNode.locator('select.model-select, select[name="model"]').first();
    await expect(modelSelect).toBeVisible();
    
    // ✅ Good: Wait for options to be populated
    await expect(modelSelect.locator('option')).toHaveCount(3, { timeout: 5000 }); // Including default option

    // Verify model names
    const options = await modelSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('llama2'))).toBeTruthy();
    expect(options.some(opt => opt.includes('codellama'))).toBeTruthy();
    
    // ✅ Good: No [object Object] bugs
    options.forEach(opt => {
      expect(opt).not.toContain('[object Object]');
    });
  });
});