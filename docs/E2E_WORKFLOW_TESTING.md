# 🧪 **E2E Workflow Testing Framework**

Complete end-to-end testing framework for AI Conflict Dashboard workflow functionality. Tests the entire pipeline from file input through multiple AI processing nodes to final analysis.

---

## 🚀 **Quick Start**

### **Prerequisites**
```bash
# Start all required services
cd backend && uvicorn main:app --reload &
cd frontend && python -m http.server 8080 &

# Install and start Ollama (optional but recommended)
ollama pull llama2
ollama serve
```

### **Run Tests**
```bash
cd frontend

# Quick smoke test
node run-e2e-workflow-tests.js --suite=smoke

# Standard comprehensive tests
node run-e2e-workflow-tests.js --suite=standard

# Full pipeline with translations
node run-e2e-workflow-tests.js --suite=comprehensive --headed

# See all options
node run-e2e-workflow-tests.js --help
```

---

## 📋 **Test Scenarios**

### **1. Story Translation Pipeline Test**
**File**: `e2e/story-translation-pipeline.spec.js`

**Flow**: Story Input → Enhancement Analysis → Chinese → French → English → Comparison

```javascript
// Example test flow
const inputNode = await framework.createInputNode({
  type: 'text',
  content: testStory.content,
  label: 'Original Story'
});

const enhancementNode = await framework.createAINode({
  model: 'ollama:llama2',
  prompt: 'Analyze and enhance this story...',
  label: 'Story Enhancement'
});

// Chain: Enhancement → Chinese → French → English → Compare
await framework.connectNodes(inputNode, enhancementNode);
// ... continue chain

const results = await framework.executeWorkflow({ timeout: 500000 });
```

**What it tests**:
- ✅ File input processing
- ✅ Multi-node AI processing chain
- ✅ Language translation accuracy
- ✅ Content preservation through translation
- ✅ Final comparison analysis

### **2. Node Manipulation Tests**
**File**: `e2e/workflow-node-manipulation.spec.js`

**Core Operations**:
- ➕ Adding nodes (input, LLM, compare, output)
- 🗑️ Removing nodes (keyboard, context menu, batch)
- 🔗 Connecting nodes (drag & drop, multiple connections)
- ✂️ Disconnecting nodes
- ⚙️ LLM configuration and activation
- 🔄 Multiple simultaneous operations

```javascript
// Example node manipulation
await page.locator('[data-node-type="llm"]').click();
await llmNode.click(); // Configure
await page.locator('textarea').fill(testPrompt);
await framework.connectNodes(inputNode, llmNode);
await page.keyboard.press('Delete'); // Remove node
```

### **3. Comprehensive Pipeline Test**
**File**: `e2e/workflow-full-pipeline.spec.js`

**Complex Workflow**: 
- Story input with validation
- Enhancement analysis with specific prompts
- Multi-language translation chain
- Quality comparison and analysis
- Error handling and recovery

---

## 🏗️ **Framework Architecture**

### **Core Components**

#### **1. WorkflowTestFramework** (`tests/helpers/workflow-automation.js`)
Main automation framework providing high-level workflow operations:

```javascript
import WorkflowTestFramework from '../tests/helpers/workflow-automation.js';

const framework = new WorkflowTestFramework(page);
await framework.initialize();

// Create nodes
const inputId = await framework.createInputNode({ content: story });
const llmId = await framework.createAINode({ model: 'ollama:llama2' });

// Connect and execute
await framework.connectNodes(inputId, llmId);
const results = await framework.executeWorkflow();
```

**Key Methods**:
- `createInputNode()` - File/text input
- `createAINode()` - LLM processing
- `createComparisonNode()` - Analysis comparison
- `createOutputNode()` - Results output
- `connectNodes()` - Node connections
- `executeWorkflow()` - Run complete workflow

#### **2. Test Data** (`tests/test-data/stories.js`)
Curated test stories for different scenarios:

```javascript
import { testStories } from '../tests/test-data/stories.js';

// Available test stories
testStories.short    // Quick tests (50-200 words)
testStories.medium   // Standard tests (500-1000 words)  
testStories.long     // Comprehensive tests (2000+ words)
testStories.dialogue // Dialogue-heavy content
testStories.technical // Technical/scientific content
```

#### **3. Environment Configuration** (`tests/config/test-environment.js`)
Environment validation and configuration:

```javascript
import TestEnvironment from '../tests/config/test-environment.js';

const env = new TestEnvironment();
const report = await env.initialize();

// Check service availability
console.log(`Ollama: ${report.services.ollama ? 'Available' : 'Missing'}`);
```

---

## 🎯 **Test Profiles**

### **Smoke Tests** (`--suite=smoke`)
- **Duration**: ~2 minutes
- **Purpose**: Quick validation
- **Coverage**: Basic node operations
- **Skip**: LLM execution

### **Standard Tests** (`--suite=standard`)  
- **Duration**: ~10 minutes
- **Purpose**: Core functionality
- **Coverage**: Full workflow with short content
- **Include**: LLM processing

### **Comprehensive Tests** (`--suite=comprehensive`)
- **Duration**: ~30 minutes
- **Purpose**: Full pipeline validation
- **Coverage**: Translation chains, large content
- **Include**: Performance monitoring

---

## 🔧 **Configuration**

### **Test Environment Variables**
```bash
# Optional configuration
export WORKFLOW_TEST_TIMEOUT=300000        # 5 minutes default
export WORKFLOW_TEST_OLLAMA_URL=localhost:11434
export WORKFLOW_TEST_STORY_LENGTH=medium   # short, medium, long
export WORKFLOW_TEST_SKIP_LLM=false        # Skip LLM tests
```

### **Model Configuration**
```javascript
// tests/config/test-environment.js
export const modelConfigs = {
  ollama: {
    llama2: {
      timeout: 120000,
      temperature: 0.7,
      maxTokens: 2000
    }
  }
};
```

### **Validation Rules**
```javascript
export const validationRules = {
  story: {
    minLength: 50,
    maxLength: 10000,
    forbiddenContent: ['<script>', 'javascript:']
  },
  translation: {
    minPreservationRatio: 0.7, // 70% meaning preservation
    maxLengthVariation: 0.5     // 50% length variation allowed
  }
};
```

---

## 📊 **Test Execution & Monitoring**

### **Real-time Progress Monitoring**
```javascript
const results = await framework.executeWorkflow({
  timeout: 300000,
  monitorProgress: true  // Shows real-time node completion
});

// Output:
// 📊 Progress: 3 completed, 1 running, 0 errors
// 📊 Progress: 4 completed, 0 running, 0 errors
// ✅ Workflow execution completed
```

### **Detailed Result Validation**
```javascript
const validation = await validatePipelineResults(results, originalStory);

// Checks:
// ✅ All expected nodes executed
// ✅ Chinese translation contains Chinese characters
// ✅ French translation contains French indicators  
// ✅ English back-translation is coherent
// ✅ Comparison analysis is comprehensive
```

### **Error Handling & Recovery**
```javascript
// Graceful failure handling
try {
  await framework.executeWorkflow();
} catch (error) {
  // Check for specific error types
  if (error.message.includes('Model not found')) {
    console.log('✅ Pipeline failed gracefully as expected');
  }
}
```

---

## 🎨 **Custom Test Development**

### **Creating New Test Scenarios**
```javascript
test('should handle custom workflow scenario', async ({ page }) => {
  const framework = new WorkflowTestFramework(page);
  await framework.initialize();
  
  // Your custom test logic
  const inputNode = await framework.createInputNode({
    type: 'file',
    fileContent: customStoryContent
  });
  
  const analysisNode = await framework.createAINode({
    model: 'ollama:custom-model',
    prompt: 'Your custom prompt here...'
  });
  
  await framework.connectNodes(inputNode, analysisNode);
  const results = await framework.executeWorkflow();
  
  // Custom validation
  expect(results.success).toBe(true);
  expect(results.nodes[analysisNode].output).toContain('expected content');
});
```

### **Adding New Node Types**
```javascript
// Extend WorkflowTestFramework
async createCustomNode(config = {}) {
  await this.page.locator('[data-node-type="custom"]').click();
  
  // Configure custom node
  const nodeCount = await this.page.locator('.drawflow-node').count();
  // ... configuration logic
  
  return nodeId;
}
```

---

## 📈 **Performance & Reliability**

### **Performance Metrics**
- **Node Creation**: < 500ms per node
- **Connection Creation**: < 200ms per connection
- **LLM Response**: < 120s (varies by model)
- **Full Pipeline**: < 10 minutes (comprehensive)

### **Reliability Features**
- **Automatic Retries**: Network timeouts, temporary failures
- **Fallback Models**: Switch to backup models on failure
- **State Preservation**: Node configuration maintained during operations
- **Memory Management**: Automatic cleanup of test resources

### **Stress Testing**
```javascript
// Test with multiple nodes and connections
for (let i = 0; i < 20; i++) {
  await page.locator('[data-node-type="llm"]').click();
}

// Verify performance doesn't degrade
const nodeCount = await page.locator('.drawflow-node').count();
expect(nodeCount).toBe(20);
```

---

## 🔍 **Debugging & Troubleshooting**

### **Common Issues**

| **Issue** | **Cause** | **Solution** |
|-----------|-----------|--------------|
| **Tests timeout** | Ollama not responding | Check `ollama serve` status |
| **Node not found** | Element selectors changed | Update selectors in framework |
| **Connection failed** | Drag & drop not working | Check browser automation settings |
| **LLM not responding** | Model not loaded | Run `ollama pull llama2` |

### **Debug Mode**
```bash
# Run with visible browser for debugging
node run-e2e-workflow-tests.js --suite=standard --headed

# Enable Playwright debug mode
DEBUG=pw:api node run-e2e-workflow-tests.js
```

### **Screenshots & Videos**
Test failures automatically capture:
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`
- **Traces**: `test-results/traces/`

---

## 📋 **Test Reports**

### **Automated Reports**
After test execution, comprehensive reports are generated:

- **JSON Report**: `test-results/workflow-test-report.json`
- **HTML Report**: `test-results/workflow-test-report.html`
- **JUnit XML**: `test-results/junit.xml` (for CI/CD)

### **Report Contents**
```json
{
  "timestamp": "2025-08-03T10:30:00Z",
  "environment": {
    "frontend": true,
    "backend": true, 
    "ollama": true
  },
  "results": {
    "passed": 8,
    "failed": 0,
    "total": 8,
    "duration": 145000
  },
  "configuration": {
    "testSuites": ["smoke", "standard", "comprehensive"]
  }
}
```

---

## 🚦 **CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: E2E Workflow Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        
      - name: Start services
        run: |
          cd backend && uvicorn main:app --port 8000 &
          cd frontend && python -m http.server 8080 &
          
      - name: Run E2E tests
        run: node run-e2e-workflow-tests.js --suite=standard
        
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: test-results/
```

---

## 🎉 **Success Criteria**

### **Test Passing Requirements**
- ✅ **Environment**: All required services available
- ✅ **Node Operations**: Add, remove, connect, disconnect
- ✅ **LLM Integration**: Model selection and execution
- ✅ **Content Processing**: File input to analysis output
- ✅ **Translation Chain**: Multi-language processing
- ✅ **Result Validation**: Content preservation and quality

### **Quality Gates**
- **Success Rate**: > 95%
- **Execution Time**: < 30 minutes (comprehensive)
- **Error Recovery**: Graceful failure handling
- **Memory Usage**: No leaks detected
- **Browser Compatibility**: Chrome, Firefox, Safari

---

## 📚 **Resources & Examples**

### **Example Workflows Tested**
1. **Simple Analysis**: Story → LLM Analysis → Output
2. **Translation Chain**: English → Chinese → French → English
3. **Comparison Study**: Original vs. Translated content analysis
4. **Multi-Model**: Same content through different AI models
5. **Error Recovery**: Invalid model → Fallback → Success

### **Real Test Output**
```
🚀 Starting comprehensive story translation pipeline...
📝 Step 1: Setting up story input...
🔍 Step 2: Setting up story enhancement analysis...
🇨🇳 Step 3: Setting up Chinese translation...
🇫🇷 Step 4: Setting up French translation...
🇺🇸 Step 5: Setting up English back-translation...
🔬 Step 6: Setting up translation comparison analysis...
🔗 Step 8: Connecting workflow pipeline...
▶️ Step 9: Executing complete pipeline...
📊 Progress: 2 completed, 1 running, 0 errors
📊 Progress: 4 completed, 1 running, 0 errors
📊 Progress: 6 completed, 0 running, 0 errors
✅ Step 10: Validating pipeline results...
🎉 Story translation pipeline completed successfully!
```

---

**Last Updated**: 2025-08-03  
**Status**: Production Ready  
**Test Coverage**: Node Operations, LLM Integration, Translation Chains  
**Supported Models**: Ollama (llama2, mistral), OpenAI (gpt-3.5, gpt-4)  
**Maintainer**: AI Conflict Dashboard Team