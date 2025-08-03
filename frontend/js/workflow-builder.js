/**
 * Workflow Builder for AI Conflict Dashboard
 * Uses Drawflow library for visual node-based workflows
 *
 * Note: Requires logger.js to be loaded before this script
 */

// Make sure we have a global workflowBuilder
window.workflowBuilder = null;

class WorkflowBuilder {
  constructor() {
    this.editor = null;
    this.nodeId = 1;
    this.selectedNode = null;
    this.selectedConnection = null;

    // Resource management for memory leak prevention
    this.timers = new Set();
    this.listeners = new Map();

    // Add error handling
    try {
      this.init();
    } catch (error) {
      logger.error(
        'workflow_builder_init_failed',
        {
          error_message: error.message,
          component: 'WorkflowBuilder',
        },
        error
      );
      this.showError('Failed to initialize workflow builder: ' + error.message);
    }
  }

  init() {
    logger.info('workflow_builder_init_start', {
      component: 'WorkflowBuilder',
    });

    // Check if Drawflow is loaded
    if (typeof Drawflow === 'undefined') {
      throw new Error('Drawflow library not loaded. Please check CDN connection.');
    }

    // Get container
    const container = document.getElementById('drawflow');
    if (!container) {
      throw new Error('Drawflow container element not found');
    }

    try {
      // Initialize Drawflow
      this.editor = new Drawflow(container);
      logger.info('drawflow_instance_created', {
        component: 'WorkflowBuilder',
        container_id: 'drawflow',
      });

      // Start the editor
      this.editor.start();
      logger.info('drawflow_editor_started', {
        component: 'WorkflowBuilder',
      });

      // Set up event listeners
      this.setupEventListeners();

      // Register node types
      this.registerNodes();

      // Load saved workflow if exists
      this.loadSavedWorkflow();

      logger.info('workflow_builder_init_success', {
        component: 'WorkflowBuilder',
        features: ['drag_drop', 'node_palette', 'export_import'],
      });
    } catch (error) {
      logger.error(
        'drawflow_init_failed',
        {
          error_message: error.message,
          component: 'WorkflowBuilder',
        },
        error
      );
      throw error;
    }
  }

  setupEventListeners() {
    // Node selection
    this.editor.on('nodeSelected', (id) => {
      this.selectedNode = id;
      this.showNodeConfig(id);
    });

    // Node deselection
    this.editor.on('nodeUnselected', () => {
      this.selectedNode = null;
      this.closeConfig();
    });

    // Connection events
    this.editor.on('connectionCreated', (connection) => {
      logger.workflow('connection_created', {
        connection_id: connection.id,
        source_node: connection.output_id,
        target_node: connection.input_id,
      });
      this.saveWorkflow();
    });

    // Node events
    this.editor.on('nodeCreated', (id) => {
      logger.workflow('node_created', {
        node_id: id,
        action: 'created',
      });
      this.saveWorkflow();
    });

    this.editor.on('nodeRemoved', (id) => {
      logger.workflow('node_removed', {
        node_id: id,
        action: 'removed',
      });
      this.saveWorkflow();
    });

    // Drag and drop from palette
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const nodeItems = document.querySelectorAll('.node-item');
    logger.info('drag_drop_setup', {
      palette_items_count: nodeItems.length,
      component: 'WorkflowBuilder',
    });

    nodeItems.forEach((item) => {
      // Ensure draggable attribute is set
      item.setAttribute('draggable', 'true');

      // Add drag start handler with tracking
      const dragHandler = (e) => {
        logger.userAction('drag_start', 'node_palette', {
          node_type: item.dataset.nodeType,
        });
        e.dataTransfer.setData('node-type', item.dataset.nodeType);
        e.dataTransfer.effectAllowed = 'copy';
      };
      this.addEventListener(item, 'dragstart', dragHandler);

      // Add click handler as fallback with tracking
      const clickHandler = (_e) => {
        logger.userAction('click', 'node_palette', {
          node_type: item.dataset.nodeType,
        });
        // Add node at center of canvas
        const nodeType = item.dataset.nodeType;
        // const canvasRect = document.getElementById('drawflow').getBoundingClientRect();
        const x = 200;
        const y = 100 + Math.random() * 200; // Slight randomization to avoid overlap
        const nodeId = this.addNode(nodeType, x, y);
        logger.workflow('node_added_via_click', {
          node_type: nodeType,
          node_id: nodeId,
          position: { x, y },
        });
      };
      this.addEventListener(item, 'click', clickHandler);

      // Visual feedback
      item.style.cursor = 'grab';
      const mouseEnterHandler = () => {
        item.style.transform = 'scale(1.05)';
      };
      this.addEventListener(item, 'mouseenter', mouseEnterHandler);

      const mouseLeaveHandler = () => {
        item.style.transform = 'scale(1)';
      };
      this.addEventListener(item, 'mouseleave', mouseLeaveHandler);
    });

    const canvas = document.getElementById('drawflow');

    const dropHandler = (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('node-type');
      logger.userAction('drop', 'workflow_canvas', {
        node_type: nodeType,
      });

      if (nodeType) {
        const pos = this.editor.pos_x_y(e.clientX, e.clientY);
        logger.workflow('node_added_via_drop', {
          node_type: nodeType,
          position: { x: pos.x, y: pos.y },
        });
        this.addNode(nodeType, pos.x, pos.y);
      }
    };
    this.addEventListener(canvas, 'drop', dropHandler);

    const dragOverHandler = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    this.addEventListener(canvas, 'dragover', dragOverHandler);

    logger.info('drag_drop_setup_complete', {
      component: 'WorkflowBuilder',
      canvas_id: 'drawflow',
    });
  }

  registerNodes() {
    // Register custom node HTML generators
    this.editor.registerNode = (_name, _html) => {
      // Store node templates
    };
  }

  addNode(type, posX, posY) {
    const nodeConfigs = {
      input: {
        name: 'Input',
        icon: '📥',
        inputs: 0,
        outputs: 1,
        data: {
          type: 'text',
          content: '',
          placeholder: 'Enter your text here...',
        },
      },
      llm: {
        name: 'AI Analysis',
        icon: '🧠',
        inputs: 1,
        outputs: 1,
        data: {
          models: ['gpt-4'],
          prompt: 'Analyze the following text:\n\n{input}',
          temperature: 0.5,
          maxTokens: 2000,
        },
      },
      compare: {
        name: 'Compare',
        icon: '🔄',
        inputs: 2,
        outputs: 1,
        data: {
          comparisonType: 'conflicts',
          highlightLevel: 'basic',
        },
      },
      summarize: {
        name: 'Summarize',
        icon: '📄',
        inputs: 1,
        outputs: 1,
        data: {
          length: 'medium',
          style: 'paragraph',
        },
      },
      output: {
        name: 'Output',
        icon: '📤',
        inputs: 1,
        outputs: 0,
        data: {
          format: 'markdown',
          includeMetadata: false,
        },
      },
    };

    const config = nodeConfigs[type];
    if (!config) {
      return;
    }

    const html = this.createNodeHTML(type, config);
    const nodeId = this.editor.addNode(
      type,
      config.inputs,
      config.outputs,
      posX,
      posY,
      type,
      config.data,
      html
    );

    this.nodeId++;
    this.saveWorkflow();
    return nodeId;
  }

  createNodeHTML(type, config) {
    const sanitized = {
      name: DOMPurify.sanitize(config.name),
      icon: DOMPurify.sanitize(config.icon),
    };

    return `
            <div class="title">
                <span>${sanitized.icon}</span>
                <span>${sanitized.name}</span>
            </div>
            <div class="content">
                ${this.getNodeContentHTML(type, config.data)}
            </div>
        `;
  }

  getNodeContentHTML(type, _data) {
    switch (type) {
      case 'input':
        return `
                    <select class="form-select form-select-sm mb-2" onchange="workflowBuilder.updateNodeData(${this.nodeId}, 'type', this.value)">
                        <option value="text">Text Input</option>
                        <option value="file">File Upload</option>
                        <option value="url">URL</option>
                    </select>
                `;

      case 'llm':
        return `
                    <div class="mb-2">
                        <small class="text-muted">Models:</small>
                        <div class="form-check form-check-sm">
                            <input class="form-check-input" type="checkbox" value="gpt-4" checked>
                            <label class="form-check-label small">GPT-4</label>
                        </div>
                        <div class="form-check form-check-sm">
                            <input class="form-check-input" type="checkbox" value="claude">
                            <label class="form-check-label small">Claude</label>
                        </div>
                        <div class="form-check form-check-sm">
                            <input class="form-check-input" type="checkbox" value="ollama">
                            <label class="form-check-label small">Ollama</label>
                        </div>
                    </div>
                `;

      case 'compare':
        return `
                    <select class="form-select form-select-sm">
                        <option value="conflicts">Find Conflicts</option>
                        <option value="consensus">Find Consensus</option>
                        <option value="differences">All Differences</option>
                    </select>
                `;

      case 'summarize':
        return `
                    <select class="form-select form-select-sm">
                        <option value="short">Short Summary</option>
                        <option value="medium">Medium Summary</option>
                        <option value="long">Detailed Summary</option>
                    </select>
                `;

      case 'output':
        return `
                    <select class="form-select form-select-sm">
                        <option value="markdown">Markdown</option>
                        <option value="json">JSON</option>
                        <option value="text">Plain Text</option>
                    </select>
                `;

      default:
        return '';
    }
  }

  showNodeConfig(nodeId) {
    const node = this.editor.getNodeFromId(nodeId);
    if (!node) {
      return;
    }

    const panel = document.getElementById('configPanel');
    const content = document.getElementById('configContent');

    // Generate config form based on node type
    // eslint-disable-next-line no-unsanitized/property
    content.innerHTML = DOMPurify.sanitize(this.generateConfigForm(node));
    panel.classList.add('open');
  }

  generateConfigForm(node) {
    const nodeClass = node.class;
    let html = `<h6 class="mb-3">${this.getNodeName(nodeClass)} Configuration</h6>`;

    switch (nodeClass) {
      case 'input':
        html += `
                    <div class="mb-3">
                        <label class="form-label">Input Type</label>
                        <select class="form-control" onchange="workflowBuilder.updateNodeData(${node.id}, 'type', this.value)">
                            <option value="text" ${node.data.type === 'text' ? 'selected' : ''}>Text Input</option>
                            <option value="file" ${node.data.type === 'file' ? 'selected' : ''}>File Upload</option>
                            <option value="url" ${node.data.type === 'url' ? 'selected' : ''}>URL</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Placeholder</label>
                        <input type="text" class="form-control" value="${node.data.placeholder || ''}" 
                               onchange="workflowBuilder.updateNodeData(${node.id}, 'placeholder', this.value)">
                    </div>
                `;
        break;

      case 'llm':
        html += `
                    <div class="mb-3">
                        <label class="form-label">Models</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="gpt-4" id="gpt4_${node.id}" 
                                   ${node.data.models?.includes('gpt-4') ? 'checked' : ''}
                                   onchange="workflowBuilder.updateModelSelection(${node.id})">
                            <label class="form-check-label" for="gpt4_${node.id}">GPT-4</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="claude-3-opus" id="claude_${node.id}"
                                   ${node.data.models?.includes('claude-3-opus') ? 'checked' : ''}
                                   onchange="workflowBuilder.updateModelSelection(${node.id})">
                            <label class="form-check-label" for="claude_${node.id}">Claude 3 Opus</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="gemini-pro" id="gemini_${node.id}"
                                   ${node.data.models?.includes('gemini-pro') ? 'checked' : ''}
                                   onchange="workflowBuilder.updateModelSelection(${node.id})">
                            <label class="form-check-label" for="gemini_${node.id}">Gemini Pro</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="ollama" id="ollama_${node.id}"
                                   ${node.data.models?.includes('ollama') ? 'checked' : ''}
                                   onchange="workflowBuilder.updateModelSelection(${node.id})">
                            <label class="form-check-label" for="ollama_${node.id}">Ollama (Local)</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Prompt</label>
                        <textarea class="form-control" rows="4" 
                                  onchange="workflowBuilder.updateNodeData(${node.id}, 'prompt', this.value)">${node.data.prompt || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Temperature: <span id="temp_${node.id}">${node.data.temperature || 0.5}</span></label>
                        <input type="range" class="form-range" min="0" max="1" step="0.1" 
                               value="${node.data.temperature || 0.5}"
                               oninput="document.getElementById('temp_${node.id}').textContent = this.value"
                               onchange="workflowBuilder.updateNodeData(${node.id}, 'temperature', parseFloat(this.value))">
                    </div>
                `;
        break;

      case 'compare':
        html += `
                    <div class="mb-3">
                        <label class="form-label">Comparison Type</label>
                        <select class="form-control" onchange="workflowBuilder.updateNodeData(${node.id}, 'comparisonType', this.value)">
                            <option value="conflicts" ${node.data.comparisonType === 'conflicts' ? 'selected' : ''}>Find Conflicts</option>
                            <option value="consensus" ${node.data.comparisonType === 'consensus' ? 'selected' : ''}>Find Consensus</option>
                            <option value="differences" ${node.data.comparisonType === 'differences' ? 'selected' : ''}>All Differences</option>
                        </select>
                    </div>
                `;
        break;

      case 'output':
        html += `
                    <div class="mb-3">
                        <label class="form-label">Output Format</label>
                        <select class="form-control" onchange="workflowBuilder.updateNodeData(${node.id}, 'format', this.value)">
                            <option value="markdown" ${node.data.format === 'markdown' ? 'selected' : ''}>Markdown</option>
                            <option value="json" ${node.data.format === 'json' ? 'selected' : ''}>JSON</option>
                            <option value="text" ${node.data.format === 'text' ? 'selected' : ''}>Plain Text</option>
                        </select>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="metadata_${node.id}"
                               ${node.data.includeMetadata ? 'checked' : ''}
                               onchange="workflowBuilder.updateNodeData(${node.id}, 'includeMetadata', this.checked)">
                        <label class="form-check-label" for="metadata_${node.id}">
                            Include Metadata
                        </label>
                    </div>
                `;
        break;
    }

    return DOMPurify.sanitize(html);
  }

  getNodeName(nodeClass) {
    const names = {
      input: 'Input',
      llm: 'AI Analysis',
      compare: 'Compare',
      summarize: 'Summarize',
      output: 'Output',
    };
    return names[nodeClass] || nodeClass;
  }

  updateNodeData(nodeId, key, value) {
    const node = this.editor.getNodeFromId(nodeId);
    if (!node) {
      return;
    }

    node.data[key] = value;
    this.editor.updateNodeDataFromId(nodeId, node.data);
    this.saveWorkflow();
  }

  updateModelSelection(nodeId) {
    const node = this.editor.getNodeFromId(nodeId);
    if (!node) {
      return;
    }

    const checkboxes = document.querySelectorAll('#configContent input[type="checkbox"]');
    const models = [];

    checkboxes.forEach((cb) => {
      if (cb.checked) {
        models.push(cb.value);
      }
    });

    this.updateNodeData(nodeId, 'models', models);
  }

  closeConfig() {
    document.getElementById('configPanel').classList.remove('open');
  }

  // Zoom controls
  zoomIn() {
    this.editor.zoom_in();
  }

  zoomOut() {
    this.editor.zoom_out();
  }

  zoomReset() {
    this.editor.zoom_reset();
  }

  // Import/Export
  exportWorkflow() {
    const exportData = this.editor.export();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importWorkflow() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          this.editor.clear();
          this.editor.import(data);
          this.saveWorkflow();
        } catch (error) {
          alert('Invalid workflow file');
          logger.error(
            'workflow_import_failed',
            {
              error_message: error.message,
              file_name: file.name,
            },
            error
          );
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  // Save/Load from localStorage
  saveWorkflow() {
    const data = this.editor.export();
    localStorage.setItem('aicd_workflow', JSON.stringify(data));
  }

  loadSavedWorkflow() {
    const saved = localStorage.getItem('aicd_workflow');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.editor.import(data);
      } catch (error) {
        logger.warn('saved_workflow_load_failed', {
          error_message: error.message,
          storage_key: 'aicd_workflow',
        });
      }
    }
  }

  // Run workflow
  async runWorkflow() {
    const exportData = this.editor.export();
    
    console.log('🚀 Running workflow with data:', exportData);

    // Validate workflow
    const validation = this.validateWorkflow(exportData);
    if (!validation.valid) {
      alert('Workflow validation failed:\n' + validation.errors.join('\n'));
      return;
    }

    // Show loading state
    const runButton = document.querySelector('.btn-primary');
    const originalText = runButton.innerHTML;
    // eslint-disable-next-line no-unsanitized/property
    runButton.innerHTML = DOMPurify.sanitize(
      '<span class="spinner-border spinner-border-sm me-2"></span>Running...'
    );
    runButton.disabled = true;

    try {
      // Convert Drawflow format to backend format
      const workflowData = this.convertToBackendFormat(exportData);

      // Get API keys from localStorage
      const apiKeys = {
        openai: localStorage.getItem('openai_api_key') || '',
        claude: localStorage.getItem('claude_api_key') || '',
        gemini: localStorage.getItem('gemini_api_key') || '',
        grok: localStorage.getItem('grok_api_key') || '',
      };

      // Execute workflow
      console.log('📤 Sending workflow to backend:', { workflow: workflowData, api_keys: Object.keys(apiKeys) });
      
      const response = await fetch('http://localhost:8000/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: workflowData,
          api_keys: apiKeys,
        }),
      });
      
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const results = await response.json();

      // Display results
      this.showResults(results);
    } catch (error) {
      alert('Workflow execution failed: ' + error.message);
      logger.error(
        'workflow_execution_failed',
        {
          error_message: error.message,
          workflow_nodes: Object.keys(exportData.drawflow.Home.data).length,
        },
        error
      );
    } finally {
      // eslint-disable-next-line no-unsanitized/property
      runButton.innerHTML = DOMPurify.sanitize(originalText);
      runButton.disabled = false;
    }
  }

  validateWorkflow(data) {
    const errors = [];

    // Check for at least one node
    const nodeCount = Object.keys(data.drawflow.Home.data).length;
    if (nodeCount === 0) {
      errors.push('Workflow must contain at least one node');
    }

    // Check for input and output nodes
    let hasInput = false;
    let hasOutput = false;

    Object.values(data.drawflow.Home.data).forEach((node) => {
      if (node.class === 'input') {
        hasInput = true;
      }
      if (node.class === 'output') {
        hasOutput = true;
      }
    });

    if (!hasInput) {
      errors.push('Workflow must have at least one input node');
    }
    if (!hasOutput) {
      errors.push('Workflow must have at least one output node');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  convertToBackendFormat(drawflowData) {
    const nodes = [];
    const edges = [];

    // Convert nodes
    Object.entries(drawflowData.drawflow.Home.data).forEach(([id, node]) => {
      nodes.push({
        id: id,
        type: node.class,
        position: { x: node.pos_x, y: node.pos_y },
        data: node.data,
      });
    });

    // Convert connections to edges
    Object.entries(drawflowData.drawflow.Home.data).forEach(([sourceId, node]) => {
      Object.entries(node.outputs).forEach(([outputName, output]) => {
        output.connections.forEach((conn) => {
          edges.push({
            id: `${sourceId}-${conn.node}-${conn.input}`,
            source: sourceId,
            target: conn.node,
            sourceHandle: outputName,
            targetHandle: conn.input,
          });
        });
      });
    });

    return { nodes, edges };
  }

  showResults(results) {
    // Create a modal or redirect to results page
    logger.workflow('execution_completed', {
      results_size: JSON.stringify(results).length,
      success: true,
    });

    // For now, just show an alert
    alert('Workflow completed successfully! Check console for results.');
  }

  showError(message) {
    // Show error in the drawflow container if initialization fails
    const container = document.getElementById('drawflow');
    if (container) {
      const errorContent = `
                <div class="alert alert-danger m-4" role="alert">
                    <h5 class="alert-heading">Error</h5>
                    <p>${message}</p>
                    <hr>
                    <p class="mb-0">Please check the browser console for more details.</p>
                </div>
            `;
      // eslint-disable-next-line no-unsanitized/property
      container.innerHTML = DOMPurify.sanitize(errorContent);
    }
    logger.error('workflow_builder_error', {
      error_message: message,
      component: 'WorkflowBuilder',
    });
  }

  /**
   * Add a timeout/interval and track it for cleanup
   */
  addTimer(callback, delay, isInterval = false) {
    const timerId = isInterval ? setInterval(callback, delay) : setTimeout(callback, delay);
    this.timers.add(timerId);

    // Also add to global tracker if available
    if (window.appTimers) {
      window.appTimers.add(timerId);
    }

    return timerId;
  }

  /**
   * Add an event listener and track it for cleanup
   */
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    const key = `${element.id || 'element'}-${event}-${Date.now()}`;
    this.listeners.set(key, { element, event, handler });

    // Also add to global tracker if available
    if (window.appListeners) {
      window.appListeners.set(key, { element, event, handler });
    }

    return key;
  }

  /**
   * Cleanup all resources (timers and event listeners)
   */
  cleanup() {
    // Clear all timers
    this.timers.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
      if (window.appTimers) {
        window.appTimers.delete(id);
      }
    });
    this.timers.clear();

    // Remove all event listeners
    this.listeners.forEach(({ element, event, handler }, key) => {
      element.removeEventListener(event, handler);
      if (window.appListeners) {
        window.appListeners.delete(key);
      }
    });
    this.listeners.clear();

    logger.info('workflow_builder_cleanup_completed', {
      component: 'WorkflowBuilder',
    });
  }
}

// Initialize workflow builder with better error handling
document.addEventListener('DOMContentLoaded', () => {
  logger.info('dom_content_loaded', {
    component: 'WorkflowBuilder',
    page: 'workflow-builder',
  });

  try {
    // Check if required libraries are loaded
    if (typeof Drawflow === 'undefined') {
      logger.error('drawflow_library_missing', {
        component: 'WorkflowBuilder',
        required_library: 'Drawflow',
        cdn_url: 'https://cdn.jsdelivr.net/npm/drawflow@0.0.59/dist/drawflow.min.js',
      });
      const container = document.getElementById('drawflow');
      if (container) {
        const missingLibContent = `
                    <div class="alert alert-danger m-4" role="alert">
                        <h5 class="alert-heading">Missing Library</h5>
                        <p>The Drawflow library failed to load from CDN.</p>
                        <p>Please check your internet connection and try refreshing the page.</p>
                    </div>
                `;
        // eslint-disable-next-line no-unsanitized/property
        container.innerHTML = DOMPurify.sanitize(missingLibContent);
      }
      return;
    }

    // Cleanup existing instance if any
    if (window.workflowBuilder && window.workflowBuilder.cleanup) {
      window.workflowBuilder.cleanup();
    }

    // Create global instance
    window.workflowBuilder = new WorkflowBuilder();
    logger.info('workflow_builder_global_assigned', {
      component: 'WorkflowBuilder',
      global_var: 'window.workflowBuilder',
      success: true,
    });
  } catch (error) {
    logger.error(
      'workflow_builder_init_critical_failure',
      {
        error_message: error.message,
        component: 'WorkflowBuilder',
        page: 'workflow-builder',
      },
      error
    );
    // Still try to show error in UI
    const container = document.getElementById('drawflow');
    if (container) {
      const initErrorContent = `
                <div class="alert alert-danger m-4" role="alert">
                    <h5 class="alert-heading">Initialization Error</h5>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Stack trace: <pre>${error.stack}</pre></p>
                </div>
            `;
      // eslint-disable-next-line no-unsanitized/property
      container.innerHTML = DOMPurify.sanitize(initErrorContent);
    }
  }
});

// Theme toggle
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Export for HTML usage
window.toggleTheme = toggleTheme;
