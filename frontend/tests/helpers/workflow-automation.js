/**
 * Workflow Automation Helpers for E2E Testing
 * Provides utilities for creating, configuring, and executing complex workflows
 */

export class WorkflowTestFramework {
  constructor(page) {
    this.page = page;
    this.nodes = new Map();
    this.connections = [];
    this.executionTimeout = 300000; // 5 minutes default
    this.nodePositions = { x: 100, y: 100 };
    this.nodeSpacing = { x: 300, y: 150 };
  }

  /**
   * Initialize the workflow builder page
   */
  async initialize() {
    await this.page.goto('http://localhost:3000/workflow-builder.html');
    await this.page.waitForSelector('#drawflow', { state: 'visible', timeout: 10000 });
    await this.page.waitForSelector('.node-palette', { state: 'visible', timeout: 10000 });

    // Clear any existing workflow
    await this.clearWorkflow();

    console.log('🚀 Workflow test framework initialized');
  }

  /**
   * Clear the current workflow
   */
  async clearWorkflow() {
    const clearButton = this.page.locator('button:has-text("Clear"), .btn-clear');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
    // Reset node positions
    this.nodePositions = { x: 100, y: 100 };
  }

  /**
   * Position a node at specific coordinates
   */
  async positionNode(node, x, y) {
    // Drag the node to the desired position
    const nodeHeader = node.locator('.drawflow_content_node, .title, .node-header').first();
    await nodeHeader.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(x, y, { steps: 5 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(200); // Let the node settle
  }

  /**
   * Get next node position and update counter
   */
  getNextNodePosition() {
    const position = { ...this.nodePositions };
    // Move to the right for next node
    this.nodePositions.x += this.nodeSpacing.x;
    // Wrap to next row if too far right
    if (this.nodePositions.x > 1000) {
      this.nodePositions.x = 100;
      this.nodePositions.y += this.nodeSpacing.y;
    }
    return position;
  }

  /**
   * Create an input node with file or text content
   */
  async createInputNode(config = {}) {
    const nodeId = `input_${Date.now()}`;

    // Add input node - click the draggable input node item
    await this.page.locator('div[data-node-type="input"].node-item').click();

    // Get the newly created node
    const nodes = this.page.locator('.drawflow-node');
    const nodeCount = await nodes.count();
    const newNode = nodes.nth(nodeCount - 1);

    // Position the node
    const position = this.getNextNodePosition();
    await this.positionNode(newNode, position.x, position.y);

    // Configure the node
    await newNode.click();

    // Ensure config panel is visible
    await this.page.evaluate(() => {
      const panel = document.getElementById('configPanel');
      if (panel) {
        panel.style.display = ''; // Reset display property
      }
    });

    await this.page.waitForSelector('#configPanel.open', { state: 'visible' });

    if (config.type === 'file') {
      await this.page.locator('select[onchange*="updateNodeData"]').selectOption('file');

      if (config.fileContent) {
        // Create a temporary file for upload
        const filePath = await this.createTempFile(
          config.fileContent,
          config.fileName || 'test-story.txt'
        );
        await this.page.setInputFiles('input[type="file"]', filePath);
      }
    } else {
      // Text input
      await this.page.locator('select[onchange*="updateNodeData"]').selectOption('text');
      const textArea = this.page.locator('textarea, input[type="text"]').last();
      await textArea.fill(config.content || '');
    }

    // Set placeholder/label if provided
    if (config.label) {
      // Try multiple possible selectors for the placeholder/label field
      const labelSelectors = [
        'input[placeholder="Placeholder"]',
        'input[type="text"]:not(textarea)',
        'input:has-text("Placeholder")',
        '.form-control:last-child input',
        '#configPanel input[type="text"]',
      ];

      for (const selector of labelSelectors) {
        const labelField = this.page.locator(selector);
        if (await labelField.isVisible()) {
          await labelField.fill(config.label);
          break;
        }
      }
    }

    await this.closeConfigPanel();

    this.nodes.set(nodeId, {
      index: nodeCount - 1,
      type: 'input',
      config: config,
    });

    console.log(`📥 Created input node: ${nodeId}`);
    return nodeId;
  }

  /**
   * Create an AI analysis/processing node
   */
  async createAINode(config = {}) {
    const nodeId = `ai_${Date.now()}`;

    // Add LLM node - click the draggable LLM node item
    await this.page.locator('div[data-node-type="llm"].node-item').click();

    const nodes = this.page.locator('.drawflow-node');
    const nodeCount = await nodes.count();
    const newNode = nodes.nth(nodeCount - 1);

    // Position the node
    const position = this.getNextNodePosition();
    await this.positionNode(newNode, position.x, position.y);

    await newNode.click();

    // Ensure config panel is visible
    await this.page.evaluate(() => {
      const panel = document.getElementById('configPanel');
      if (panel) {
        panel.style.display = ''; // Reset display property
      }
    });

    await this.page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Configure model - handle checkbox-based model selection
    if (config.model) {
      // First uncheck all models
      const allModelCheckboxes = this.page.locator('#configPanel input[type="checkbox"]');
      const checkboxCount = await allModelCheckboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = allModelCheckboxes.nth(i);
        if (await checkbox.isChecked()) {
          await checkbox.uncheck();
        }
      }

      // Check if this is an Ollama model
      if (config.model === 'ollama' || config.model.includes('ollama:') || config.model === 'gemma3:4b') {
        // For Ollama models, look for the Ollama checkbox
        const ollamaCheckbox = this.page.locator(
          '#configPanel input[type="checkbox"][value="ollama"]'
        );
        if ((await ollamaCheckbox.count()) > 0) {
          await ollamaCheckbox.check();
          console.log('✅ Selected Ollama model');
        } else {
          // Fallback: try clicking the label
          const ollamaLabel = this.page.locator('#configPanel label:has-text("Ollama")');
          if ((await ollamaLabel.count()) > 0) {
            await ollamaLabel.click();
            console.log('✅ Selected Ollama model via label');
          } else {
            console.log('⚠️ No Ollama checkbox found in UI');
          }
        }
      } else {
        // For non-Ollama models, use the mapping
        const modelMappings = {
          'gpt-4': 'GPT-4',
          claude: 'Claude 3 Opus',
          gemini: 'Gemini Pro',
        };

        const targetModel = modelMappings[config.model] || config.model;
        const modelCheckbox = this.page.locator(
          `#configPanel input[type="checkbox"] + label:has-text("${targetModel}"), #configPanel label:has-text("${targetModel}") input[type="checkbox"]`
        );

        if ((await modelCheckbox.count()) > 0) {
          await modelCheckbox.first().click();
        }
      }
    }

    // Configure prompt - clear existing content first
    if (config.prompt) {
      const promptTextarea = this.page.locator('#configPanel textarea');
      await promptTextarea.click();
      await promptTextarea.selectText();
      await promptTextarea.fill(config.prompt);
    }

    // Configure temperature
    if (config.temperature !== undefined) {
      const tempSlider = this.page.locator('input[type="range"]');
      await tempSlider.fill(config.temperature.toString());
    }

    // Configure max tokens
    if (config.maxTokens) {
      const tokensInput = this.page.locator('input[placeholder*="tokens"], input[type="number"]');
      await tokensInput.fill(config.maxTokens.toString());
    }

    // Set label/placeholder if provided
    if (config.label) {
      const labelSelectors = [
        'input[placeholder="Placeholder"]',
        'input[type="text"]:not(textarea)',
        '#configPanel input[type="text"]',
      ];

      for (const selector of labelSelectors) {
        const labelField = this.page.locator(selector);
        if (await labelField.isVisible()) {
          await labelField.fill(config.label);
          break;
        }
      }
    }

    await this.closeConfigPanel();

    this.nodes.set(nodeId, {
      index: nodeCount - 1,
      type: 'ai',
      config: config,
    });

    console.log(`🧠 Created AI node: ${nodeId} (${config.label || config.model})`);
    return nodeId;
  }

  /**
   * Create a comparison node
   */
  async createComparisonNode(config = {}) {
    const nodeId = `compare_${Date.now()}`;

    // Add comparison node - click the draggable compare node item
    await this.page.locator('div[data-node-type="compare"].node-item').click();

    const nodes = this.page.locator('.drawflow-node');
    const nodeCount = await nodes.count();
    const newNode = nodes.nth(nodeCount - 1);

    // Position the node
    const position = this.getNextNodePosition();
    await this.positionNode(newNode, position.x, position.y);

    await newNode.click();

    // Ensure config panel is visible
    await this.page.evaluate(() => {
      const panel = document.getElementById('configPanel');
      if (panel) {
        panel.style.display = ''; // Reset display property
      }
    });

    await this.page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Set comparison type
    if (config.comparisonType) {
      await this.page.locator('select').selectOption(config.comparisonType);
    }

    // Set custom prompt if provided
    if (config.prompt) {
      await this.page.locator('textarea').fill(config.prompt);
    }

    // Set label/placeholder if provided
    if (config.label) {
      const labelSelectors = [
        'input[placeholder="Placeholder"]',
        'input[type="text"]:not(textarea)',
        '#configPanel input[type="text"]',
      ];

      for (const selector of labelSelectors) {
        const labelField = this.page.locator(selector);
        if (await labelField.isVisible()) {
          await labelField.fill(config.label);
          break;
        }
      }
    }

    await this.closeConfigPanel();

    this.nodes.set(nodeId, {
      index: nodeCount - 1,
      type: 'comparison',
      config: config,
    });

    console.log(`🔍 Created comparison node: ${nodeId}`);
    return nodeId;
  }

  /**
   * Create an output node
   */
  async createOutputNode(config = {}) {
    const nodeId = `output_${Date.now()}`;

    // Add output node - click the draggable output node item
    await this.page.locator('div[data-node-type="output"].node-item').click();

    const nodes = this.page.locator('.drawflow-node');
    const nodeCount = await nodes.count();
    const newNode = nodes.nth(nodeCount - 1);

    // Position the node
    const position = this.getNextNodePosition();
    await this.positionNode(newNode, position.x, position.y);

    await newNode.click();

    // Ensure config panel is visible
    await this.page.evaluate(() => {
      const panel = document.getElementById('configPanel');
      if (panel) {
        panel.style.display = ''; // Reset display property
      }
    });

    await this.page.waitForSelector('#configPanel.open', { state: 'visible' });

    // Configure output format - be more specific with selector
    if (config.format) {
      const formatSelect = this.page.locator('#configPanel select').first();
      await formatSelect.selectOption(config.format);
    }

    // Configure metadata inclusion
    if (config.includeMetadata !== undefined) {
      const checkbox = this.page.locator('#configPanel input[type="checkbox"]');
      if (config.includeMetadata) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    // Set label/placeholder if provided
    if (config.label) {
      const labelSelectors = [
        'input[placeholder="Placeholder"]',
        'input[type="text"]:not(textarea)',
        '#configPanel input[type="text"]',
      ];

      for (const selector of labelSelectors) {
        const labelField = this.page.locator(selector);
        if (await labelField.isVisible()) {
          await labelField.fill(config.label);
          break;
        }
      }
    }

    await this.closeConfigPanel();

    this.nodes.set(nodeId, {
      index: nodeCount - 1,
      type: 'output',
      config: config,
    });

    console.log(`📤 Created output node: ${nodeId}`);
    return nodeId;
  }

  /**
   * Connect two nodes
   */
  async connectNodes(sourceNodeId, targetNodeId, targetInput = null) {
    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new Error(`Invalid node IDs: ${sourceNodeId} -> ${targetNodeId}`);
    }

    // Get the actual node IDs from Drawflow
    const sourceDrawflowId = await this.page.evaluate((index) => {
      const nodes = document.querySelectorAll('.drawflow-node');
      return nodes[index]?.id?.replace('node-', '');
    }, sourceNode.index);

    const targetDrawflowId = await this.page.evaluate((index) => {
      const nodes = document.querySelectorAll('.drawflow-node');
      return nodes[index]?.id?.replace('node-', '');
    }, targetNode.index);

    if (!sourceDrawflowId || !targetDrawflowId) {
      throw new Error('Could not find Drawflow node IDs');
    }

    // Use Drawflow's API to create the connection programmatically
    const connectionCreated = await this.page.evaluate(
      ({ sourceId, targetId, outputClass, inputClass }) => {
        if (window.workflowBuilder && window.workflowBuilder.editor) {
          try {
            // Add connection using Drawflow API
            window.workflowBuilder.editor.addConnection(
              sourceId,
              targetId,
              outputClass || 'output_1',
              inputClass || 'input_1'
            );
            return true;
          } catch (error) {
            console.error('Failed to create connection:', error);
            return false;
          }
        }
        return false;
      },
      {
        sourceId: sourceDrawflowId,
        targetId: targetDrawflowId,
        outputClass: 'output_1',
        inputClass: targetInput || 'input_1',
      }
    );

    if (!connectionCreated) {
      throw new Error(
        `Failed to create connection between nodes ${sourceNodeId} -> ${targetNodeId}`
      );
    }

    // Wait a moment for the connection to render
    await this.page.waitForTimeout(200);

    this.connections.push({
      source: sourceNodeId,
      target: targetNodeId,
      input: targetInput,
    });

    console.log(
      `🔗 Connected ${sourceNodeId} -> ${targetNodeId}${targetInput ? ` (${targetInput})` : ''}`
    );
  }

  /**
   * Execute the workflow
   */
  async executeWorkflow(options = {}) {
    const timeout = options.timeout || this.executionTimeout;

    console.log('▶️ Starting workflow execution...');

    // Click run button
    await this.page.locator('button:has-text("Run")').click();

    // Wait for execution to start
    await this.page.waitForSelector('.workflow-running, .execution-started', {
      state: 'visible',
      timeout: 10000,
    });

    // Monitor progress if requested
    if (options.monitorProgress) {
      await this.monitorExecution();
    }

    // Wait for completion
    await this.page.waitForSelector('.workflow-complete, .execution-complete', {
      state: 'visible',
      timeout: timeout,
    });

    console.log('✅ Workflow execution completed');

    // Get results
    return await this.getResults();
  }

  /**
   * Monitor workflow execution progress
   */
  async monitorExecution() {
    let previousCompletedCount = 0;

    while (true) {
      const completedNodes = await this.page.locator('.node-status-completed').count();
      const runningNodes = await this.page.locator('.node-status-running').count();
      const errorNodes = await this.page.locator('.node-status-error').count();

      if (completedNodes > previousCompletedCount) {
        console.log(
          `📊 Progress: ${completedNodes} completed, ${runningNodes} running, ${errorNodes} errors`
        );
        previousCompletedCount = completedNodes;
      }

      // Check if execution is complete
      const isComplete = await this.page.locator('.workflow-complete').isVisible();
      if (isComplete) break;

      // Check for errors
      if (errorNodes > 0) {
        const errorMessage = await this.page.locator('.node-error-message').first().textContent();
        console.warn(`⚠️ Node error detected: ${errorMessage}`);
      }

      await this.page.waitForTimeout(1000); // Check every second
    }
  }

  /**
   * Get workflow execution results
   */
  async getResults() {
    const results = {
      success: true,
      nodes: {},
      errors: [],
      executionTime: null,
      summary: null,
    };

    try {
      // Get overall results
      const resultsContainer = this.page.locator('.workflow-results, .execution-results');
      if (await resultsContainer.isVisible()) {
        results.summary = await resultsContainer.textContent();
      }

      // Get individual node results
      for (const [nodeId, nodeInfo] of this.nodes) {
        const nodeElement = this.page.locator('.drawflow-node').nth(nodeInfo.index);
        const nodeResults = await this.getNodeResults(nodeElement);
        results.nodes[nodeId] = nodeResults;
      }

      // Check for errors
      const errorElements = this.page.locator('.node-status-error');
      const errorCount = await errorElements.count();

      for (let i = 0; i < errorCount; i++) {
        const errorElement = errorElements.nth(i);
        const errorMessage = await errorElement.textContent();
        results.errors.push(errorMessage);
      }

      results.success = results.errors.length === 0;
    } catch (error) {
      results.success = false;
      results.errors.push(`Failed to get results: ${error.message}`);
    }

    return results;
  }

  /**
   * Get results from a specific node
   */
  async getNodeResults(nodeElement) {
    const nodeResults = {
      status: 'unknown',
      output: null,
      error: null,
      executionTime: null,
    };

    try {
      // Get node status
      if (await nodeElement.locator('.node-status-completed').isVisible()) {
        nodeResults.status = 'completed';
      } else if (await nodeElement.locator('.node-status-running').isVisible()) {
        nodeResults.status = 'running';
      } else if (await nodeElement.locator('.node-status-error').isVisible()) {
        nodeResults.status = 'error';
        nodeResults.error = await nodeElement.locator('.error-message').textContent();
      }

      // Get output if available
      const outputElement = nodeElement.locator('.node-output, .output-content');
      if (await outputElement.isVisible()) {
        nodeResults.output = await outputElement.textContent();
      }
    } catch (error) {
      nodeResults.error = `Failed to get node results: ${error.message}`;
    }

    return nodeResults;
  }

  /**
   * Validate workflow results
   */
  async validateResults(results, expectations = {}) {
    const validation = {
      passed: true,
      issues: [],
    };

    // Check overall success
    if (!results.success && !expectations.allowFailure) {
      validation.passed = false;
      validation.issues.push('Workflow execution failed');
    }

    // Check node count
    if (
      expectations.expectedNodes &&
      Object.keys(results.nodes).length !== expectations.expectedNodes
    ) {
      validation.passed = false;
      validation.issues.push(
        `Expected ${expectations.expectedNodes} nodes, got ${Object.keys(results.nodes).length}`
      );
    }

    // Check for required outputs
    if (expectations.requiredOutputs) {
      for (const requiredOutput of expectations.requiredOutputs) {
        let found = false;
        for (const nodeResult of Object.values(results.nodes)) {
          if (nodeResult.output && nodeResult.output.includes(requiredOutput)) {
            found = true;
            break;
          }
        }
        if (!found) {
          validation.passed = false;
          validation.issues.push(`Required output not found: ${requiredOutput}`);
        }
      }
    }

    // Check error count
    if (expectations.maxErrors !== undefined && results.errors.length > expectations.maxErrors) {
      validation.passed = false;
      validation.issues.push(
        `Too many errors: ${results.errors.length} > ${expectations.maxErrors}`
      );
    }

    return validation;
  }

  /**
   * Helper methods
   */
  async closeConfigPanel() {
    // Execute the same function the UI uses
    await this.page.evaluate(() => {
      const panel = document.getElementById('configPanel');
      if (panel) {
        panel.classList.remove('open');
        // Also set display none to ensure it's completely hidden
        panel.style.display = 'none';
      }
    });

    // Wait for panel to be hidden
    await this.page.waitForSelector('#configPanel', { state: 'hidden' });

    // Additional wait for safety
    await this.page.waitForTimeout(100);
  }

  async createTempFile(content, fileName = 'temp.txt') {
    // In a real implementation, this would create a temporary file
    // For testing purposes, we'll use the page's file input functionality
    const tempPath = `/tmp/${fileName}`;
    return tempPath;
  }

  // Cleanup
  destroy() {
    this.nodes.clear();
    this.connections = [];
    console.log('🧹 Workflow test framework cleaned up');
  }
}

export default WorkflowTestFramework;
