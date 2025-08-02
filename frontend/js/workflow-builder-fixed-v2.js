/**
 * Workflow Builder for AI Conflict Dashboard - Fixed Version 2
 * Uses Drawflow library for visual node-based workflows
 * This version ensures the workflowBuilder is globally accessible
 */

// Make sure we have a global workflowBuilder
window.workflowBuilder = null;

class WorkflowBuilder {
    constructor() {
        this.editor = null;
        this.nodeId = 1;
        this.selectedNode = null;
        this.selectedConnection = null;
        
        // Add error handling
        try {
            this.init();
        } catch (error) {
            console.error('WorkflowBuilder initialization error:', error);
            this.showError('Failed to initialize workflow builder: ' + error.message);
        }
    }

    init() {
        console.log('Initializing WorkflowBuilder...');
        
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
            console.log('Drawflow instance created');
            
            // Start the editor
            this.editor.start();
            console.log('Editor started');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Register node types
            this.registerNodes();
            
            // Load saved workflow if exists
            this.loadWorkflow();
            
            console.log('WorkflowBuilder initialized successfully');
        } catch (error) {
            console.error('Error during Drawflow initialization:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Node selection
        this.editor.on('nodeSelected', (id) => {
            this.selectedNode = id;
            this.showNodeConfig(id);
        });

        // Node removal
        this.editor.on('nodeRemoved', (id) => {
            if (this.selectedNode === id) {
                this.selectedNode = null;
                this.hideNodeConfig();
            }
        });

        // Connection events
        this.editor.on('connectionCreated', (connection) => {
            console.log('Connection created:', connection);
        });

        // Connection selection and deletion
        this.editor.on('connectionSelected', (connection) => {
            console.log('Connection selected:', connection);
            this.selectedConnection = connection;
        });

        this.editor.on('connectionRemoved', (connection) => {
            console.log('Connection removed:', connection);
            this.selectedConnection = null;
        });

        // Add keyboard event listener for Delete key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Check if we're not typing in an input field
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    if (this.selectedConnection) {
                        // Remove the selected connection
                        this.editor.removeSingleConnection(
                            this.selectedConnection.output_id,
                            this.selectedConnection.input_id,
                            this.selectedConnection.output_class,
                            this.selectedConnection.input_class
                        );
                        this.selectedConnection = null;
                    } else if (this.selectedNode) {
                        // Remove the selected node
                        this.removeNode(this.selectedNode);
                    }
                }
            }
        });

        // Add visual feedback for connection hover
        this.setupConnectionInteraction();

        // Drag and drop from palette
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const nodeItems = document.querySelectorAll('.node-item');
        console.log(`Found ${nodeItems.length} node items in palette`);
        
        nodeItems.forEach(item => {
            // Ensure draggable attribute is set
            item.setAttribute('draggable', 'true');
            
            // Add drag start handler
            item.addEventListener('dragstart', (e) => {
                console.log('Drag started for:', item.dataset.node);
                e.dataTransfer.setData('node-type', item.dataset.node);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            // Add click handler as fallback
            item.addEventListener('click', (e) => {
                console.log('Click detected on:', item.dataset.node);
                // Add node at center of canvas
                const nodeType = item.dataset.node;
                const canvasRect = document.getElementById('drawflow').getBoundingClientRect();
                const x = 200;
                const y = 100 + (Math.random() * 200); // Slight randomization to avoid overlap
                const nodeId = this.addNode(nodeType, x, y);
                console.log(`Added node ${nodeType} with ID ${nodeId} at (${x}, ${y})`);
            });
            
            // Visual feedback
            item.style.cursor = 'grab';
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.05)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
        });

        const drawflowElement = document.getElementById('drawflow');
        
        drawflowElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('node-type');
            console.log('Drop event - node type:', nodeType);
            
            if (nodeType) {
                const pos = this.editor.pos_x_y(e.clientX, e.clientY);
                console.log(`Dropping ${nodeType} at (${pos.x}, ${pos.y})`);
                this.addNode(nodeType, pos.x, pos.y);
            }
        });

        drawflowElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        console.log('Drag and drop setup complete');
    }

    setupConnectionInteraction() {
        // Add CSS for connection hover effect
        const style = document.createElement('style');
        style.textContent = `
            .drawflow svg path {
                cursor: pointer;
                transition: stroke-width 0.2s;
            }
            .drawflow svg path:hover {
                stroke-width: 5px;
                filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.5));
            }
            .drawflow svg path.selected {
                stroke-width: 5px;
                stroke: #dc3545;
                filter: drop-shadow(0 0 5px rgba(220, 53, 69, 0.5));
            }
        `;
        document.head.appendChild(style);

        // Add instructions to the UI
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
        `;
        instructions.innerHTML = `
            <i class="bi bi-info-circle"></i> 
            Click on a connection to select it, then press Delete to remove it
        `;
        document.getElementById('drawflow').appendChild(instructions);

        // Auto-hide instructions after 5 seconds
        setTimeout(() => {
            instructions.style.transition = 'opacity 0.5s';
            instructions.style.opacity = '0';
            setTimeout(() => instructions.remove(), 500);
        }, 5000);

        // Add right-click context menu for connections
        document.getElementById('drawflow').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Check if clicking on a connection (SVG path)
            if (e.target.tagName === 'path' && e.target.parentElement.tagName === 'svg') {
                // Create context menu
                this.removeContextMenu(); // Remove any existing menu
                
                const menu = document.createElement('div');
                menu.id = 'connection-context-menu';
                menu.style.cssText = `
                    position: absolute;
                    left: ${e.pageX}px;
                    top: ${e.pageY}px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                    padding: 5px 0;
                `;
                
                const deleteOption = document.createElement('div');
                deleteOption.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    color: #dc3545;
                `;
                deleteOption.innerHTML = '<i class="bi bi-trash"></i> Delete Connection';
                deleteOption.onclick = () => {
                    if (this.selectedConnection) {
                        this.editor.removeSingleConnection(
                            this.selectedConnection.output_id,
                            this.selectedConnection.input_id,
                            this.selectedConnection.output_class,
                            this.selectedConnection.input_class
                        );
                    }
                    this.removeContextMenu();
                };
                
                deleteOption.onmouseover = () => {
                    deleteOption.style.background = '#f8f9fa';
                };
                deleteOption.onmouseout = () => {
                    deleteOption.style.background = 'white';
                };
                
                menu.appendChild(deleteOption);
                document.body.appendChild(menu);
                
                // Remove menu when clicking elsewhere
                setTimeout(() => {
                    document.addEventListener('click', this.removeContextMenu, { once: true });
                }, 10);
            }
        });
    }

    removeContextMenu() {
        const menu = document.getElementById('connection-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    registerNodes() {
        // Register each node type with Drawflow
        console.log('Registering node types...');
    }

    addNode(type, x, y) {
        const nodeId = this.editor.addNode(
            type,
            this.getNodeInputs(type),
            this.getNodeOutputs(type),
            x,
            y,
            type,
            {},
            this.getNodeHTML(type)
        );
        
        this.nodeId++;
        return nodeId;
    }

    getNodeInputs(type) {
        switch(type) {
            case 'input': return 0;
            case 'llm': return 1;
            case 'compare': return 2;
            case 'summarize': return 1;
            case 'output': return 1;
            default: return 1;
        }
    }

    getNodeOutputs(type) {
        switch(type) {
            case 'input': return 1;
            case 'llm': return 1;
            case 'compare': return 1;
            case 'summarize': return 1;
            case 'output': return 0;
            default: return 1;
        }
    }

    getNodeHTML(type) {
        const icons = {
            input: '📥',
            llm: '🧠',
            compare: '🔄',
            summarize: '📄',
            output: '📤'
        };

        const titles = {
            input: 'Input',
            llm: 'AI Analysis',
            compare: 'Compare',
            summarize: 'Summarize',
            output: 'Output'
        };

        return `
            <div class="title">
                <span>${icons[type] || '📦'}</span>
                ${titles[type] || type}
            </div>
            <div class="content">
                ${this.getNodeContent(type)}
            </div>
        `;
    }

    getNodeContent(type) {
        switch(type) {
            case 'input':
                return '<textarea class="form-control form-control-sm" placeholder="Enter text..."></textarea>';
            case 'llm':
                return `
                    <select class="form-select form-select-sm node-llm-select" onchange="window.workflowBuilder.handleLLMChange(this)">
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude">Claude</option>
                        <option value="gemini">Gemini</option>
                        <option value="grok">Grok</option>
                        <option value="ollama">Ollama</option>
                    </select>
                    <div class="ollama-model-select" style="display: none; margin-top: 5px;">
                        <select class="form-select form-select-sm">
                            <option>Loading Ollama models...</option>
                        </select>
                    </div>
                `;
            case 'compare':
                return '<small>Compare inputs</small>';
            case 'summarize':
                return '<small>Summarize input</small>';
            case 'output':
                return '<small>Final output</small>';
            default:
                return '';
        }
    }

    showNodeConfig(nodeId) {
        const node = this.editor.getNodeFromId(nodeId);
        const configPanel = document.getElementById('configPanel');
        const configContent = document.getElementById('configContent');
        
        if (!configPanel || !configContent) return;
        
        configContent.innerHTML = `
            <h6>Node Configuration</h6>
            <p>Type: ${node.name}</p>
            <p>ID: ${nodeId}</p>
            <div class="mt-3">
                <button class="btn btn-sm btn-danger" onclick="window.workflowBuilder.removeNode(${nodeId})">
                    Delete Node
                </button>
            </div>
        `;
        
        configPanel.classList.add('open');
    }

    hideNodeConfig() {
        const configPanel = document.getElementById('configPanel');
        if (configPanel) {
            configPanel.classList.remove('open');
        }
    }

    removeNode(nodeId) {
        this.editor.removeNodeId(nodeId);
        this.hideNodeConfig();
    }

    closeConfig() {
        this.hideNodeConfig();
    }

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
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        this.editor.clear();
                        this.editor.import(data);
                    } catch (error) {
                        alert('Error importing workflow: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    async runWorkflow() {
        const workflowData = this.editor.export();
        
        // Check if workflow has nodes
        if (Object.keys(workflowData.drawflow.Home.data).length === 0) {
            alert('Please create a workflow first');
            return;
        }
        
        // Get API keys from main app
        const apiKeys = {
            openai: localStorage.getItem('openai_api_key') || '',
            anthropic: localStorage.getItem('anthropic_api_key') || '',
            google: localStorage.getItem('google_api_key') || '',
            grok: localStorage.getItem('grok_api_key') || ''
        };
        
        try {
            // Show loading state
            this.showLoading();
            
            // Fixed: Use absolute URL for backend
            const response = await fetch('http://localhost:8000/api/workflows/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workflow: workflowData,
                    api_keys: apiKeys
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            this.showResults(result);
            
        } catch (error) {
            console.error('Workflow execution error:', error);
            this.showError('Failed to execute workflow: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    loadWorkflow() {
        const saved = localStorage.getItem('workflow');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.editor.import(data);
            } catch (error) {
                console.error('Error loading saved workflow:', error);
            }
        }
    }

    saveWorkflow() {
        const data = this.editor.export();
        localStorage.setItem('workflow', JSON.stringify(data));
    }

    zoomIn() {
        this.editor.zoom_in();
    }

    zoomOut() {
        this.editor.zoom_out();
    }

    zoomReset() {
        this.editor.zoom_reset();
    }

    showLoading() {
        // Implementation for loading state
        console.log('Loading...');
    }

    hideLoading() {
        // Implementation to hide loading state
        console.log('Loading complete');
    }

    showResults(results) {
        // Implementation to show results
        console.log('Results:', results);
        alert('Workflow executed successfully! Check console for results.');
    }

    showError(message) {
        // Show error in the drawflow container if initialization fails
        const container = document.getElementById('drawflow');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger m-4" role="alert">
                    <h5 class="alert-heading">Error</h5>
                    <p>${message}</p>
                    <hr>
                    <p class="mb-0">Please check the browser console for more details.</p>
                </div>
            `;
        }
        console.error('WorkflowBuilder Error:', message);
    }

    handleLLMChange(selectElement) {
        const nodeElement = selectElement.closest('.drawflow-node');
        const ollamaDiv = nodeElement.querySelector('.ollama-model-select');
        
        if (selectElement.value === 'ollama') {
            ollamaDiv.style.display = 'block';
            this.loadOllamaModels(ollamaDiv.querySelector('select'));
        } else {
            ollamaDiv.style.display = 'none';
        }
    }

    async loadOllamaModels(selectElement) {
        try {
            console.log('Loading Ollama models...');
            const response = await fetch('http://localhost:8000/api/ollama/models');
            
            if (!response.ok) {
                throw new Error(`Failed to load Ollama models: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.available && data.models && data.models.length > 0) {
                selectElement.innerHTML = data.models.map(model => 
                    `<option value="${model}">${model}</option>`
                ).join('');
                console.log(`Loaded ${data.models.length} Ollama models`);
            } else {
                selectElement.innerHTML = '<option>No Ollama models found</option>';
                console.warn('No Ollama models available');
            }
        } catch (error) {
            console.error('Error loading Ollama models:', error);
            selectElement.innerHTML = '<option>Error loading models</option>';
        }
    }
}

// Make functions globally available for onclick handlers
window.toggleTheme = function() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize workflow builder with better error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WorkflowBuilder...');
    
    try {
        // Check if required libraries are loaded
        if (typeof Drawflow === 'undefined') {
            console.error('Drawflow library not loaded!');
            const container = document.getElementById('drawflow');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger m-4" role="alert">
                        <h5 class="alert-heading">Missing Library</h5>
                        <p>The Drawflow library failed to load from CDN.</p>
                        <p>Please check your internet connection and try refreshing the page.</p>
                    </div>
                `;
            }
            return;
        }
        
        // Create global instance
        window.workflowBuilder = new WorkflowBuilder();
        console.log('✅ WorkflowBuilder created and assigned to window.workflowBuilder');
        
    } catch (error) {
        console.error('❌ Failed to initialize WorkflowBuilder:', error);
        // Still try to show error in UI
        const container = document.getElementById('drawflow');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger m-4" role="alert">
                    <h5 class="alert-heading">Initialization Error</h5>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Stack trace: <pre>${error.stack}</pre></p>
                </div>
            `;
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

// Global error handler for debugging
window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
    console.error('   Message:', event.message);
    console.error('   File:', event.filename);
    console.error('   Line:', event.lineno, 'Column:', event.colno);
});