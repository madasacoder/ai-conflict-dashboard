# 🟨 **JavaScript Coding Standards - AI Conflict Dashboard**

This document defines mandatory JavaScript/frontend standards that mirror our backend Python standards. All AI coding assistants must follow these rules exactly.

**Status**: DRAFT - Based on codebase analysis and backend standards alignment  
**Applies To**: All frontend JavaScript, HTML, CSS, and future TypeScript code  

---

## 🚫 **CRITICAL RULES (Zero Tolerance)**

### 1. **NO CONSOLE.LOG VIOLATIONS**
```javascript
// ❌ FORBIDDEN
console.log("Debug message");
console.error("Error occurred"); 
console.warn("Warning");

// ✅ REQUIRED - Structured Logging
logger.info("user_action", {
    action: "button_click",
    component: "workflow_builder", 
    user_id: sessionId,
    timestamp: Date.now()
});

logger.error("api_call_failed", {
    endpoint: "/api/analyze",
    error_code: 500,
    request_id: "abc123",
    duration_ms: 1234
});
```

**Rationale**: Aligns with backend structured logging, enables production debugging, prevents secret exposure.

### 2. **NO UNSAFE INNERHTML**
```javascript
// ❌ FORBIDDEN - XSS Vulnerability
element.innerHTML = userInput;
element.innerHTML = `<div>${data}</div>`;

// ✅ REQUIRED - Always Sanitize
element.innerHTML = DOMPurify.sanitize(userInput);
element.innerHTML = DOMPurify.sanitize(`<div>${data}</div>`);

// ✅ PREFERRED - Use textContent for Plain Text
element.textContent = userInput;
```

**Rationale**: Prevents XSS attacks, maintains security standards.

### 3. **NO DUPLICATE/TEMPORARY FILES**
```bash
# ❌ FORBIDDEN (Same as Python rules)
workflow-builder-fixed.js
workflow-builder-v2.js  
utils-backup.js
component_old.js

# ✅ REQUIRED
workflow-builder.js  # Single clean implementation
utils.js             # No versioning in filenames
```

**Rationale**: Maintains clean codebase, prevents confusion, follows CLAUDE.md rules.

---

## 🔒 **SECURITY STANDARDS**

### 4. **INPUT VALIDATION**
```javascript
// ✅ REQUIRED - Validate All Inputs
function validateApiKey(key) {
    if (!key || typeof key !== 'string') {
        throw new ValidationError("API key must be a non-empty string");
    }
    if (key.length < 10 || key.length > 200) {
        throw new ValidationError("API key length invalid");
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(key)) {
        throw new ValidationError("API key contains invalid characters");
    }
    return true;
}

// ✅ REQUIRED - Sanitize Before Storage
function sanitizeUserInput(input) {
    return DOMPurify.sanitize(input.trim());
}
```

### 5. **NO DYNAMIC EXECUTION**
```javascript
// ❌ FORBIDDEN
eval(userCode);
Function(userCode)();
setTimeout(userCode); // String form

// ✅ REQUIRED
setTimeout(() => { /* function body */ }, 1000); // Function form only
```

### 6. **SECRET PROTECTION**
```javascript
// ❌ FORBIDDEN - Never Log Secrets
logger.info("API Response", { apiKey: key, response: data });

// ✅ REQUIRED - Sanitize Logs
logger.info("API Response", { 
    keyPrefix: key.substring(0, 8) + "...",
    responseLength: data.length 
});
```

---

## 📝 **DOCUMENTATION STANDARDS**

### 7. **JSDOC FOR ALL FUNCTIONS** (Mirror Python Docstrings)
```javascript
/**
 * Analyze text using multiple AI models with structured logging.
 * 
 * @param {string} text - The input text to analyze
 * @param {Object} apiKeys - Object containing API keys for providers
 * @param {string} apiKeys.openai - OpenAI API key (optional)
 * @param {string} apiKeys.claude - Claude API key (optional)
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} Analysis results with model responses
 * @throws {ValidationError} When input validation fails
 * @throws {TimeoutError} When request exceeds timeout
 * 
 * @example
 * const result = await analyzeText(
 *     "Hello world", 
 *     { openai: "sk-..." }, 
 *     { timeout: 5000 }
 * );
 */
async function analyzeText(text, apiKeys, options = {}) {
    // Implementation
}
```

### 8. **STRUCTURED COMMENTS**
```javascript
// ✅ REQUIRED - Structured Comments
// TODO: Implement retry logic with exponential backoff
// FIXME: Memory leak in event listener cleanup  
// SECURITY: Validate input before DOM manipulation
// PERFORMANCE: Consider debouncing this event handler
```

---

## 🔧 **CODE QUALITY STANDARDS**

### 9. **MODERN JAVASCRIPT (ES6+)**
```javascript
// ❌ FORBIDDEN - Legacy Patterns
var userName = "test";
function processData() { }

// ✅ REQUIRED - Modern Patterns  
const userName = "test";
const processData = () => { };
const processAsync = async () => { };

// ✅ REQUIRED - Template Literals
const message = `User ${userName} completed action`;

// ✅ REQUIRED - Destructuring
const { name, email } = userData;
const [first, second] = arrayData;
```

### 10. **ERROR HANDLING** 
```javascript
// ✅ REQUIRED - Structured Error Handling
async function callAPI(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new APIError(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
    } catch (error) {
        logger.error("api_call_failed", {
            endpoint: endpoint,
            error: error.message,
            data_size: JSON.stringify(data).length
        });
        throw error;
    }
}
```

### 11. **MEMORY MANAGEMENT**
```javascript
// ✅ REQUIRED - Always Cleanup
class WorkflowComponent {
    constructor() {
        this.timers = new Set();
        this.listeners = new Map();
    }
    
    addTimer(callback, delay) {
        const timerId = setTimeout(callback, delay);
        this.timers.add(timerId);
        return timerId;
    }
    
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.set(`${element.id}-${event}`, { element, event, handler });
    }
    
    // ✅ REQUIRED - Cleanup Method
    cleanup() {
        // Clear all timers
        this.timers.forEach(id => clearTimeout(id));
        this.timers.clear();
        
        // Remove all listeners  
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners.clear();
    }
}
```

---

## 🧪 **TESTING STANDARDS**

### 12. **TEST COVERAGE REQUIREMENTS**
- **Minimum Coverage**: 85% (matching backend target)
- **Unit Tests**: All utility functions
- **Integration Tests**: All workflows 
- **E2E Tests**: Critical user paths

### 13. **TESTING STACK IMPLEMENTATION** 
```json
// ✅ IMPLEMENTED - package.json dependencies
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0", 
    "@testing-library/user-event": "^14.5.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^1.0.0",
    "happy-dom": "^12.10.3",
    "msw": "^2.0.0"
  }
}
```

### 14. **VITEST CONFIGURATION**
```typescript
// ✅ IMPLEMENTED - vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  }
});
```

### 15. **PLAYWRIGHT CONFIGURATION**
```javascript
// ✅ IMPLEMENTED - playwright.config.js
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ],
  webServer: [
    { command: 'python3 -m http.server 8080', port: 8080 },
    { command: 'uvicorn main:app --port 8000', port: 8000 }
  ]
});
```

### 16. **COMPONENT TESTING PATTERN**
```javascript
// ✅ IMPLEMENTED - tests/components/WorkflowBuilder.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('WorkflowBuilder', () => {
    beforeEach(() => {
        // ✅ REQUIRED - Setup DOM structure
        document.body.innerHTML = `
            <div id="drawflow"></div>
            <div class="node-palette">
                <div class="node-item" data-node-type="input">Input</div>
            </div>
        `;
        
        // ✅ REQUIRED - Reset mocks
        vi.clearAllMocks();
        global.logger.info.mockClear();
    });
    
    test('should initialize with structured logging', async () => {
        const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
        new WorkflowBuilder();
        
        // ✅ REQUIRED - Verify structured logging
        expect(global.logger.info).toHaveBeenCalledWith('workflow_builder_init_start', {
            component: 'WorkflowBuilder'
        });
    });
    
    test('should sanitize HTML with DOMPurify', async () => {
        const { WorkflowBuilder } = await import('../../js/workflow-builder.js');
        const builder = new WorkflowBuilder();
        
        builder.addNode('input', 100, 100);
        
        // ✅ REQUIRED - Verify XSS protection
        expect(global.DOMPurify.sanitize).toHaveBeenCalled();
    });
});
```

### 17. **E2E TESTING PATTERN**
```javascript
// ✅ IMPLEMENTED - e2e/workflow-builder-comprehensive.spec.js
import { test, expect } from '@playwright/test';

test.describe('Workflow Builder E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/workflow-builder.html');
        await page.waitForSelector('#drawflow', { state: 'visible' });
    });
    
    test('should create workflow via drag and drop', async ({ page }) => {
        const inputNode = page.locator('[data-node-type="input"]');
        const canvas = page.locator('#drawflow');
        
        await inputNode.dragTo(canvas, {
            targetPosition: { x: 200, y: 100 }
        });
        
        await expect(page.locator('.drawflow-node')).toBeVisible();
    });
    
    test('should prevent XSS through configuration', async ({ page }) => {
        await page.locator('[data-node-type="llm"]').click();
        await page.locator('.drawflow-node').first().click();
        
        const script = '<script>window.xssExecuted = true;</script>';
        await page.locator('textarea').fill(script);
        
        const xssExecuted = await page.evaluate(() => window.xssExecuted);
        expect(xssExecuted).toBeFalsy();
    });
});
```

### 18. **TEST SETUP CONFIGURATION**
```typescript
// ✅ IMPLEMENTED - tests/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
    cleanup();
});

// ✅ REQUIRED - Mock structured logger
global.logger = {
    info: vi.fn(),
    warn: vi.fn(), 
    error: vi.fn(),
    debug: vi.fn(),
    workflow: vi.fn(),
    userAction: vi.fn(),
};

// ✅ REQUIRED - Mock DOMPurify
global.DOMPurify = {
    sanitize: vi.fn((input: string) => input)
};
```

### 19. **TESTING COMMANDS**
```bash
# ✅ IMPLEMENTED - npm scripts in package.json
npm test                    # Run unit tests with Vitest
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Run tests with coverage report
npm run test:e2e           # Run E2E tests with Playwright

# ✅ Coverage targets per CLAUDE.md
# Branches: 85% | Functions: 85% | Lines: 85% | Statements: 85%
```

### 20. **TEST NAMING CONVENTION**
```javascript
// ✅ REQUIRED - Descriptive Test Names
test('should sanitize user input before rendering');
test('should log API errors with correlation ID');
test('should cleanup event listeners on component unmount');
test('should validate API key format before submission');
test('should prevent XSS attacks through node configuration');
test('should handle large workflows efficiently');
test('should maintain workflow state during navigation');
```

---

## 🎯 **PERFORMANCE STANDARDS**

### 14. **EVENT HANDLING**
```javascript
// ✅ REQUIRED - Debounced Events
const debouncedSearch = debounce((query) => {
    searchAPI(query);
}, 300);

// ✅ REQUIRED - Event Delegation
document.addEventListener('click', (event) => {
    if (event.target.matches('.workflow-node')) {
        handleNodeClick(event);
    }
});
```

### 15. **DOM OPTIMIZATION**
```javascript
// ❌ FORBIDDEN - Repeated DOM Queries
document.getElementById('node-1').style.color = 'red';
document.getElementById('node-1').style.background = 'blue';

// ✅ REQUIRED - Cache DOM References
const node = document.getElementById('node-1');
node.style.color = 'red';
node.style.background = 'blue';
```

---

## 📦 **MODULE STANDARDS**

### 16. **IMPORT/EXPORT STRUCTURE**
```javascript
// ✅ REQUIRED - Named Exports
export const validateInput = (input) => { };
export const sanitizeData = (data) => { };

// ✅ REQUIRED - Default Export for Main Component
export default class WorkflowBuilder { }

// ✅ REQUIRED - Clear Imports
import { validateInput, sanitizeData } from './utils.js';
import WorkflowBuilder from './WorkflowBuilder.js';
```

### 17. **FILE ORGANIZATION**
```
js/
├── components/          # React-like components
│   ├── WorkflowBuilder.js
│   └── NodePalette.js
├── utils/               # Utility functions  
│   ├── logger.js        # Structured logging
│   ├── validation.js    # Input validation
│   └── api.js          # API client
├── constants/           # Application constants
│   └── config.js
└── tests/              # Test files
    ├── components/
    └── utils/
```

---

## 🔄 **DEVELOPMENT WORKFLOW**

### 18. **LINTING REQUIREMENTS**
```json
// .eslintrc.json - REQUIRED Configuration
{
    "extends": ["eslint:recommended"],
    "rules": {
        "no-console": "error",           // Enforce no console.log
        "no-eval": "error",              // No eval() usage
        "no-unused-vars": "error",       // No unused variables
        "prefer-const": "error",         // Use const when possible
        "no-var": "error"                // No var declarations
    },
    "globals": {
        "DOMPurify": "readonly",
        "bootstrap": "readonly"
    }
}
```

### 19. **GIT HOOKS**
```bash
# .git/hooks/pre-commit - REQUIRED
#!/bin/sh
npx eslint js/**/*.js --max-warnings 0
npm run test:coverage
```

### 20. **BUILD PROCESS**
```javascript
// ✅ REQUIRED - Minification + Source Maps
// Build process must:
// 1. Run ESLint with zero warnings
// 2. Run all tests with 85%+ coverage  
// 3. Minify for production
// 4. Generate source maps
// 5. Validate no console.log in production builds
```

---

## 🚀 **API INTEGRATION STANDARDS**

### 21. **STRUCTURED API CALLS**
```javascript
// ✅ REQUIRED - API Client Pattern
class APIClient {
    constructor(baseURL, timeout = 5000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }
    
    async request(endpoint, options = {}) {
        const requestId = generateRequestId();
        const startTime = Date.now();
        
        logger.info("api_request_start", {
            endpoint: endpoint,
            method: options.method || 'GET',
            request_id: requestId
        });
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    ...options.headers
                }
            });
            
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                logger.error("api_request_failed", {
                    endpoint: endpoint,
                    status: response.status,
                    request_id: requestId,
                    duration_ms: duration
                });
                throw new APIError(`HTTP ${response.status}`);
            }
            
            logger.info("api_request_success", {
                endpoint: endpoint,
                request_id: requestId,
                duration_ms: duration
            });
            
            return await response.json();
            
        } catch (error) {
            logger.error("api_request_error", {
                endpoint: endpoint,
                error: error.message,
                request_id: requestId
            });
            throw error;
        }
    }
}
```

---

## ⚛️ **REACT STANDARDS** (Desktop App & Future Components)

### 25. **COMPONENT STRUCTURE & NAMING**
```jsx
// ✅ REQUIRED - PascalCase for Components
const WorkflowBuilder = ({ nodes, onNodeAdd, apiKeys }) => {
    // Component implementation
};

// ✅ REQUIRED - camelCase for Props
const NodePalette = ({ 
    nodeTypes,           // Array of available node types
    onNodeSelect,        // Function to handle node selection
    isVisible,           // Boolean for visibility state
    className = ""       // Default props where appropriate
}) => {
    // Implementation
};

// ❌ FORBIDDEN - Improper Naming
const workflow_builder = () => { };  // snake_case
const workflowbuilder = () => { };   // lowercase
const WORKFLOW_BUILDER = () => { };  // SCREAMING_CASE
```

### 26. **HOOKS BEST PRACTICES**
```jsx
// ✅ REQUIRED - Proper useEffect Cleanup
const WorkflowComponent = () => {
    const [nodes, setNodes] = useState([]);
    
    useEffect(() => {
        const timerId = setInterval(() => {
            // Auto-save workflow
            saveWorkflow(nodes);
        }, 30000);
        
        // ✅ REQUIRED - Cleanup Function
        return () => {
            clearInterval(timerId);
        };
    }, [nodes]); // ✅ REQUIRED - Dependency Array
    
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Delete') {
                deleteSelectedNode();
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        
        // ✅ REQUIRED - Remove Event Listeners
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []); // ✅ Empty dependency array for mount/unmount only
};
```

### 27. **STATE MANAGEMENT PATTERNS**
```jsx
// ✅ REQUIRED - Structured State Updates
const useWorkflowState = () => {
    const [workflow, setWorkflow] = useState({
        nodes: [],
        edges: [],
        metadata: {
            createdAt: Date.now(),
            lastModified: Date.now()
        }
    });
    
    const addNode = useCallback((nodeType, position) => {
        const newNode = {
            id: generateNodeId(),
            type: nodeType,
            position: position,
            data: getDefaultNodeData(nodeType),
            createdAt: Date.now()
        };
        
        setWorkflow(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode],
            metadata: {
                ...prev.metadata,
                lastModified: Date.now()
            }
        }));
        
        // ✅ REQUIRED - Log State Changes
        logger.info("workflow_node_added", {
            nodeId: newNode.id,
            nodeType: nodeType,
            totalNodes: workflow.nodes.length + 1
        });
    }, [workflow.nodes.length]);
    
    return { workflow, addNode };
};
```

### 28. **COMPONENT LIFECYCLE & CLEANUP**
```jsx
// ✅ REQUIRED - Custom Hook for Resource Management
const useResourceCleanup = () => {
    const resourcesRef = useRef({
        timers: new Set(),
        listeners: new Map(),
        subscriptions: new Set()
    });
    
    const addTimer = useCallback((callback, delay) => {
        const timerId = setTimeout(callback, delay);
        resourcesRef.current.timers.add(timerId);
        return timerId;
    }, []);
    
    const addListener = useCallback((element, event, handler) => {
        element.addEventListener(event, handler);
        const key = `${element.id || 'unknown'}-${event}`;
        resourcesRef.current.listeners.set(key, { element, event, handler });
    }, []);
    
    // ✅ REQUIRED - Cleanup on Unmount
    useEffect(() => {
        return () => {
            const { timers, listeners, subscriptions } = resourcesRef.current;
            
            // Clear all timers
            timers.forEach(id => clearTimeout(id));
            
            // Remove all listeners
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            
            // Cancel all subscriptions
            subscriptions.forEach(unsub => unsub());
        };
    }, []);
    
    return { addTimer, addListener };
};
```

### 29. **ERROR BOUNDARIES** 
```jsx
// ✅ REQUIRED - Error Boundary for All Major Components
class WorkflowErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        // ✅ REQUIRED - Log Errors with Context
        logger.error("react_component_error", {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            component: this.props.componentName || 'unknown'
        });
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong in {this.props.componentName}</h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                    </details>
                </div>
            );
        }
        
        return this.props.children;
    }
}

// ✅ REQUIRED - Usage
const App = () => (
    <WorkflowErrorBoundary componentName="WorkflowBuilder">
        <WorkflowBuilder />
    </WorkflowErrorBoundary>
);
```

### 30. **PERFORMANCE OPTIMIZATION**
```jsx
// ✅ REQUIRED - Memoization for Expensive Calculations
const WorkflowStats = ({ nodes, edges }) => {
    const stats = useMemo(() => {
        return {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            connectedComponents: calculateConnectedComponents(nodes, edges),
            complexity: calculateComplexity(nodes, edges)
        };
    }, [nodes, edges]); // ✅ Proper dependencies
    
    return <div>Stats: {JSON.stringify(stats)}</div>;
};

// ✅ REQUIRED - Callback Memoization for Event Handlers
const NodePalette = ({ onNodeDrop }) => {
    const handleDragStart = useCallback((event) => {
        const nodeType = event.target.dataset.nodeType;
        event.dataTransfer.setData('application/node-type', nodeType);
        
        logger.info("node_drag_started", {
            nodeType: nodeType,
            timestamp: Date.now()
        });
    }, []); // ✅ Empty deps - handler doesn't change
    
    const handleNodeClick = useCallback((nodeType) => {
        onNodeDrop?.(nodeType);
    }, [onNodeDrop]); // ✅ Include callback in deps
    
    return (
        <div className="node-palette">
            {nodeTypes.map(type => (
                <div 
                    key={type.id}
                    draggable
                    onDragStart={handleDragStart}
                    onClick={() => handleNodeClick(type.name)}
                >
                    {type.name}
                </div>
            ))}
        </div>
    );
};

// ✅ REQUIRED - Component Memoization for Pure Components
const NodeDisplay = React.memo(({ node, isSelected }) => {
    return (
        <div className={`node ${isSelected ? 'selected' : ''}`}>
            <h3>{node.type}</h3>
            <p>{node.data.label}</p>
        </div>
    );
});
```

### 31. **JSX PATTERNS & ANTI-PATTERNS**
```jsx
// ✅ REQUIRED - Proper JSX Patterns
const WorkflowNode = ({ node, onUpdate, onDelete }) => {
    return (
        <div 
            className="workflow-node"
            data-node-id={node.id}
            data-node-type={node.type}
            role="button"
            tabIndex={0}
            aria-label={`${node.type} node`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onUpdate?.(node.id);
                }
            }}
        >
            <header className="node-header">
                <h3>{node.data.label}</h3>
                <button 
                    onClick={() => onDelete?.(node.id)}
                    aria-label="Delete node"
                    className="btn-delete"
                >
                    ×
                </button>
            </header>
            
            <div className="node-content">
                {node.data.description && (
                    <p className="node-description">
                        {DOMPurify.sanitize(node.data.description)}
                    </p>
                )}
            </div>
        </div>
    );
};

// ❌ FORBIDDEN - Anti-Patterns
const BadComponent = ({ data }) => {
    return (
        <div>
            {/* ❌ No key prop in lists */}
            {data.map(item => <div>{item.name}</div>)}
            
            {/* ❌ Inline object creation (causes re-renders) */}
            <SomeComponent style={{ color: 'red' }} />
            
            {/* ❌ Missing error boundaries */}
            <SomeUnstableComponent />
            
            {/* ❌ Dangerous innerHTML without sanitization */}
            <div dangerouslySetInnerHTML={{ __html: userInput }} />
        </div>
    );
};
```

### 32. **PROPS & PROPTYPES/TYPESCRIPT**
```jsx
// ✅ REQUIRED - TypeScript Interface (Preferred)
interface WorkflowNodeProps {
    node: {
        id: string;
        type: 'input' | 'llm' | 'output' | 'compare';
        position: { x: number; y: number };
        data: Record<string, any>;
    };
    isSelected?: boolean;
    onSelect?: (nodeId: string) => void;
    onUpdate?: (nodeId: string, data: any) => void;
    onDelete?: (nodeId: string) => void;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({ 
    node, 
    isSelected = false, 
    onSelect, 
    onUpdate, 
    onDelete 
}) => {
    // Implementation
};

// ✅ ACCEPTABLE - PropTypes (if not using TypeScript)
import PropTypes from 'prop-types';

const WorkflowNode = ({ node, isSelected, onSelect }) => {
    // Implementation
};

WorkflowNode.propTypes = {
    node: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['input', 'llm', 'output', 'compare']).isRequired,
        position: PropTypes.shape({
            x: PropTypes.number.isRequired,
            y: PropTypes.number.isRequired
        }).isRequired,
        data: PropTypes.object
    }).isRequired,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func
};

WorkflowNode.defaultProps = {
    isSelected: false,
    onSelect: () => {}
};
```

### 33. **CONTEXT & STATE MANAGEMENT**
```jsx
// ✅ REQUIRED - Typed Context
interface WorkflowContextType {
    workflow: Workflow;
    addNode: (type: string, position: Position) => void;
    removeNode: (id: string) => void;
    addEdge: (source: string, target: string) => void;
    removeEdge: (id: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

// ✅ REQUIRED - Custom Hook for Context
const useWorkflow = () => {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error('useWorkflow must be used within WorkflowProvider');
    }
    return context;
};

// ✅ REQUIRED - Provider Component
const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
    
    const addNode = useCallback((type: string, position: Position) => {
        const newNode = createNode(type, position);
        setWorkflow(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
        }));
        
        logger.info("workflow_node_added", {
            nodeId: newNode.id,
            nodeType: type
        });
    }, []);
    
    const value = useMemo(() => ({
        workflow,
        addNode,
        removeNode,
        addEdge,
        removeEdge
    }), [workflow, addNode]);
    
    return (
        <WorkflowContext.Provider value={value}>
            {children}
        </WorkflowContext.Provider>
    );
};
```

### 34. **TESTING WITH REACT TESTING LIBRARY**
```jsx
// ✅ REQUIRED - Component Testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowBuilder } from './WorkflowBuilder';

describe('WorkflowBuilder', () => {
    beforeEach(() => {
        // Reset any global state
        jest.clearAllMocks();
    });
    
    test('should add node when palette item is clicked', async () => {
        const user = userEvent.setup();
        const mockOnNodeAdd = jest.fn();
        
        render(
            <WorkflowBuilder 
                nodes={[]}
                onNodeAdd={mockOnNodeAdd}
            />
        );
        
        const inputNodeButton = screen.getByRole('button', { name: /add input node/i });
        await user.click(inputNodeButton);
        
        expect(mockOnNodeAdd).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'input'
            })
        );
    });
    
    test('should handle drag and drop workflow', async () => {
        render(<WorkflowBuilder />);
        
        const draggableNode = screen.getByTestId('palette-llm-node');
        const dropZone = screen.getByTestId('workflow-canvas');
        
        // Simulate drag and drop
        fireEvent.dragStart(draggableNode, {
            dataTransfer: {
                setData: jest.fn(),
                effectAllowed: 'copy'
            }
        });
        
        fireEvent.dragOver(dropZone);
        fireEvent.drop(dropZone, {
            dataTransfer: {
                getData: jest.fn().mockReturnValue('llm')
            }
        });
        
        await waitFor(() => {
            expect(screen.getByText('LLM Node')).toBeInTheDocument();
        });
    });
    
    test('should cleanup resources on unmount', () => {
        const { unmount } = render(<WorkflowBuilder />);
        
        // Spy on cleanup functions
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
        
        unmount();
        
        expect(clearTimeoutSpy).toHaveBeenCalled();
        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});
```

### 35. **REACT SPECIFIC LINTING RULES**
```json
// .eslintrc.json - React Extensions
{
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    "rules": {
        "react/prop-types": "error",              // Require prop validation
        "react/no-unused-prop-types": "error",   // No unused prop types
        "react/jsx-key": "error",                 // Require key prop in lists
        "react/jsx-no-bind": "warn",              // Avoid inline functions
        "react/jsx-pascal-case": "error",         // Component names in PascalCase
        "react/no-array-index-key": "warn",      // Avoid array indices as keys
        "react/no-danger": "error",               // No dangerouslySetInnerHTML
        "react-hooks/rules-of-hooks": "error",   // Follow hooks rules
        "react-hooks/exhaustive-deps": "warn"    // Complete dependency arrays
    },
    "settings": {
        "react": {
            "version": "detect"
        }
    }
}
```

---

## 🎨 **UI/UX STANDARDS**

### 22. **ACCESSIBILITY REQUIREMENTS**
```html
<!-- ✅ REQUIRED - Semantic HTML -->
<button aria-label="Add new workflow node" class="btn-add-node">
    <span class="sr-only">Add Node</span>
    <i class="icon-plus" aria-hidden="true"></i>
</button>

<!-- ✅ REQUIRED - Keyboard Navigation -->
<div class="workflow-node" tabindex="0" role="button" 
     aria-describedby="node-help" onkeydown="handleKeyPress(event)">
</div>
```

### 23. **RESPONSIVE DESIGN**
```css
/* ✅ REQUIRED - Mobile First */
.workflow-builder {
    display: flex;
    flex-direction: column;
}

@media (min-width: 768px) {
    .workflow-builder {
        flex-direction: row;
    }
}
```

---

## 📊 **MONITORING & OBSERVABILITY**

### 24. **STRUCTURED LOGGING IMPLEMENTATION**
```javascript
// ✅ REQUIRED - Frontend Logger
class StructuredLogger {
    constructor(config = {}) {
        this.sessionId = generateSessionId();
        this.backendURL = config.backendURL || '/api/log';
    }
    
    async log(level, event, data = {}) {
        const logEntry = {
            level: level,
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            url: window.location.href,
            user_agent: navigator.userAgent
        };
        
        // Send to backend for correlation
        try {
            await fetch(this.backendURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            // Fallback to console only if backend unavailable
            console.warn('Logging backend unavailable:', error);
        }
    }
    
    info(event, data) { return this.log('info', event, data); }
    warn(event, data) { return this.log('warn', event, data); }
    error(event, data) { return this.log('error', event, data); }
    debug(event, data) { return this.log('debug', event, data); }
}

// ✅ REQUIRED - Global Logger Instance
const logger = new StructuredLogger();
```

---

## ✅ **COMPLIANCE CHECKLIST**

### **Before Committing Code:**
- [ ] Zero console.log statements
- [ ] All innerHTML uses DOMPurify.sanitize()
- [ ] JSDoc comments on all functions
- [ ] ESLint passes with zero warnings
- [ ] Tests pass with 85%+ coverage
- [ ] No unused variables or imports
- [ ] Event listeners have cleanup
- [ ] Timers are properly cleared
- [ ] No _fixed, _backup, or versioned files
- [ ] Structured logging used throughout
- [ ] Input validation on all user data
- [ ] Error handling with correlation IDs

### **Code Review Checklist:**
- [ ] Security: No XSS vulnerabilities
- [ ] Performance: No memory leaks
- [ ] Standards: Follows all rules above
- [ ] Documentation: Clear JSDoc comments
- [ ] Testing: Adequate test coverage
- [ ] Accessibility: ARIA attributes present
- [ ] Maintainability: Clean, readable code

---

## 🎯 **AI ASSISTANT GUIDELINES**

When working on JavaScript code:

1. **Read these standards first** before making any changes
2. **Fix console.log violations immediately** - zero tolerance
3. **Always use DOMPurify** for any innerHTML operations
4. **Add JSDoc comments** to all new functions
5. **Include error handling** with structured logging
6. **Write tests** for new functionality
7. **Follow memory management** patterns
8. **Use modern ES6+ syntax** exclusively
9. **Validate all inputs** before processing
10. **Clean up resources** in component lifecycle

---

**Enforcement**: These standards are mandatory. Code that violates them will be rejected in review.

**Updates**: This document will evolve as the codebase matures and new requirements emerge.

**Status**: READY FOR IMPLEMENTATION (Based on comprehensive codebase analysis)

---

**Last Updated**: 2025-08-03  
**Next Review**: After implementing console.log fixes  
**Owner**: AI Conflict Dashboard Team