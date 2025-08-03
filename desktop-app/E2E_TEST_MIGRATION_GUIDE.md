# E2E Test Migration Guide for Desktop App

## Overview
This guide provides detailed instructions for migrating the web app's E2E tests to the desktop app, starting with the most critical user workflows.

## Prerequisites

### 1. Set Up E2E Testing Framework
```bash
cd desktop-app
npm install --save-dev @playwright/test @playwright/experimental-ct-react
npx playwright install
```

### 2. Create E2E Test Structure
```bash
mkdir -p src/__tests__/e2e
mkdir -p src/__tests__/helpers
mkdir -p src/__tests__/fixtures
```

## Test Migration Examples

### Example 1: Migrating `workflow-builder-comprehensive.spec.js`

**Original Web Test Structure:**
```javascript
// frontend/e2e/workflow-builder-comprehensive.spec.js
test('create and execute translation workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/workflow-builder.html');
  
  // Create nodes
  await page.locator('div[data-node-type="input"]').click();
  await page.locator('div[data-node-type="llm"]').click();
  
  // Connect nodes
  // ... drag and drop logic
  
  // Execute workflow
  await page.locator('button:has-text("Run")').click();
});
```

**Migrated Desktop Test:**
```typescript
// desktop-app/src/__tests__/e2e/WorkflowComprehensive.test.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { WorkflowBuilder } from '../../components/WorkflowBuilder';

test.describe('Comprehensive Workflow Builder Tests', () => {
  test('create and execute translation workflow', async ({ mount, page }) => {
    // Mount the React component
    const component = await mount(<WorkflowBuilder />);
    
    // Create nodes using React Flow
    await component.locator('[data-testid="node-palette-input"]').click();
    await component.locator('[data-testid="node-palette-llm"]').click();
    
    // Connect nodes (React Flow specific)
    const inputNode = await page.locator('.react-flow__node-input').first();
    const llmNode = await page.locator('.react-flow__node-llm').first();
    
    // Drag from output handle to input handle
    const outputHandle = inputNode.locator('.source-handle');
    const inputHandle = llmNode.locator('.target-handle');
    
    await outputHandle.dragTo(inputHandle);
    
    // Configure nodes
    await llmNode.dblclick();
    await page.fill('[data-testid="prompt-input"]', 'Translate to Chinese: {input}');
    await page.selectOption('[data-testid="model-select"]', 'ollama');
    
    // Execute workflow
    await component.locator('[data-testid="execute-workflow"]').click();
    
    // Verify execution
    await expect(page.locator('[data-testid="execution-status"]')).toContainText('completed');
  });
});
```

### Example 2: Migrating Translation Pipeline Test

**Original Web Test:**
```javascript
// frontend/e2e/execute-translation-pipeline.spec.js
test('execute multi-language translation pipeline', async ({ page }) => {
  const testStory = "Once upon a time...";
  
  // Create input node
  await framework.createInputNode({
    type: 'text',
    content: testStory
  });
  
  // Create translation nodes
  const chineseNode = await framework.createAINode({
    model: 'ollama',
    prompt: 'Translate to Chinese: {input}'
  });
  
  // Connect and execute
  await framework.connectNodes(inputId, chineseNode);
  await framework.executeWorkflow();
});
```

**Migrated Desktop Test:**
```typescript
// desktop-app/src/__tests__/e2e/TranslationPipeline.test.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { DesktopWorkflowFramework } from '../helpers/DesktopWorkflowFramework';

test.describe('Translation Pipeline E2E Tests', () => {
  let framework: DesktopWorkflowFramework;

  test.beforeEach(async ({ mount, page }) => {
    framework = new DesktopWorkflowFramework(page, mount);
    await framework.initialize();
  });

  test('execute multi-language translation pipeline', async () => {
    const testStory = "Once upon a time in a land far away...";
    
    // Create input node with story
    const inputNode = await framework.createInputNode({
      type: 'text',
      content: testStory
    });
    
    // Create translation chain: English -> Chinese -> French -> English
    const chineseNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Translate to Chinese: {input}',
      position: { x: 400, y: 100 }
    });
    
    const frenchNode = await framework.createLLMNode({
      model: 'ollama', 
      prompt: 'Translate to French: {input}',
      position: { x: 700, y: 100 }
    });
    
    const englishNode = await framework.createLLMNode({
      model: 'ollama',
      prompt: 'Translate to English: {input}',
      position: { x: 1000, y: 100 }
    });
    
    const compareNode = await framework.createCompareNode({
      position: { x: 1300, y: 100 }
    });
    
    // Connect the pipeline
    await framework.connectNodes(inputNode.id, chineseNode.id);
    await framework.connectNodes(chineseNode.id, frenchNode.id);
    await framework.connectNodes(frenchNode.id, englishNode.id);
    await framework.connectNodes(inputNode.id, compareNode.id, 'input_1');
    await framework.connectNodes(englishNode.id, compareNode.id, 'input_2');
    
    // Execute and verify
    const results = await framework.executeWorkflow();
    
    expect(results.nodes[chineseNode.id].status).toBe('completed');
    expect(results.nodes[frenchNode.id].status).toBe('completed');
    expect(results.nodes[englishNode.id].status).toBe('completed');
    expect(results.nodes[compareNode.id].output).toContain('similarity');
  });
});
```

### Helper Framework for Desktop

Create a helper framework similar to the web app's:

```typescript
// desktop-app/src/__tests__/helpers/DesktopWorkflowFramework.ts
import { Page } from '@playwright/test';
import { ReactWrapper } from '@playwright/experimental-ct-react';

export class DesktopWorkflowFramework {
  constructor(
    private page: Page,
    private mount: (component: JSX.Element) => Promise<ReactWrapper>
  ) {}

  async initialize() {
    this.component = await this.mount(<WorkflowBuilder />);
    await this.page.waitForSelector('.react-flow__renderer');
  }

  async createInputNode(config: InputNodeConfig) {
    // Click on input node in palette
    await this.component.locator('[data-testid="node-palette-input"]').click();
    
    // Wait for node to appear
    const node = await this.page.waitForSelector('.react-flow__node-input');
    
    // Configure if needed
    if (config.content) {
      await node.dblclick();
      await this.page.fill('[data-testid="input-content"]', config.content);
      await this.page.click('[data-testid="save-config"]');
    }
    
    return { id: await node.getAttribute('data-id') };
  }

  async createLLMNode(config: LLMNodeConfig) {
    await this.component.locator('[data-testid="node-palette-llm"]').click();
    
    // Position the node
    if (config.position) {
      // React Flow specific positioning
      await this.page.mouse.move(config.position.x, config.position.y);
      await this.page.mouse.click();
    }
    
    const node = await this.page.waitForSelector('.react-flow__node-llm:last-child');
    
    // Configure
    await node.dblclick();
    await this.page.fill('[data-testid="prompt-input"]', config.prompt);
    await this.page.selectOption('[data-testid="model-select"]', config.model);
    await this.page.click('[data-testid="save-config"]');
    
    return { id: await node.getAttribute('data-id') };
  }

  async connectNodes(sourceId: string, targetId: string, targetHandle?: string) {
    // React Flow connection logic
    const sourceNode = await this.page.locator(`[data-id="${sourceId}"]`);
    const targetNode = await this.page.locator(`[data-id="${targetId}"]`);
    
    const sourceHandle = sourceNode.locator('.source-handle');
    const targetHandleSelector = targetHandle 
      ? `[data-handleid="${targetHandle}"]` 
      : '.target-handle';
    const handle = targetNode.locator(targetHandleSelector);
    
    await sourceHandle.dragTo(handle);
  }

  async executeWorkflow() {
    await this.component.locator('[data-testid="execute-workflow"]').click();
    
    // Wait for execution to complete
    await this.page.waitForSelector('[data-testid="execution-complete"]', {
      timeout: 60000 // Allow time for AI calls
    });
    
    // Get results
    return await this.page.evaluate(() => {
      return window.workflowStore?.getState().executionResults;
    });
  }
}
```

## Critical E2E Tests to Migrate (Priority Order)

### Week 1 - Core Workflows
1. **Day 1-2**: Basic workflow creation and execution
   - `workflow-builder-comprehensive.spec.js`
   - `basic-workflow-execution.spec.js`
   - `workflow-node-manipulation.spec.js`

2. **Day 3-4**: Translation pipelines (most complex)
   - `execute-translation-pipeline.spec.js`
   - `story-translation-pipeline.spec.js`
   - `simple-chinese-translation.spec.js`

3. **Day 5**: Ollama integration
   - `workflow-builder-ollama.spec.js`
   - `ollama-translation-pipeline.spec.js`
   - `verify-ollama-execution.spec.js`

4. **Day 6**: Output and display
   - `test-output-display.spec.js`
   - `verify-output-display.spec.js`

5. **Day 7**: Regression tests
   - `regression-all-bugs.spec.js` (20 bugs to verify)

## Key Differences to Handle

### 1. Component Mounting
- Web app: Direct DOM manipulation
- Desktop: React component mounting with Playwright CT

### 2. Node Creation
- Web app: Click on HTML elements
- Desktop: Interact with React Flow nodes

### 3. Connections
- Web app: Drawflow drag-and-drop
- Desktop: React Flow connection handles

### 4. State Access
- Web app: Global window objects
- Desktop: Zustand store access

### 5. API Mocking
- Web app: Intercept fetch calls
- Desktop: May need to mock at different levels

## Success Criteria

Each migrated E2E test should:
1. ✅ Test the same user workflow
2. ✅ Use desktop-specific selectors
3. ✅ Handle React Flow interactions
4. ✅ Verify through Zustand state
5. ✅ Run in under 2 minutes
6. ✅ Be maintainable and readable

## Next Steps

1. Set up Playwright with React support
2. Create the DesktopWorkflowFramework helper
3. Start with `workflow-builder-comprehensive.spec.js`
4. Migrate one test at a time, ensuring it passes
5. Document any desktop-specific behaviors

This migration will ensure the desktop app maintains the same quality and reliability as the web app while leveraging its superior architecture.