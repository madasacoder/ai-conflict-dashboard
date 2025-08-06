# Web App vs Desktop App Feature Comparison

## Date: 2025-08-03
## Purpose: Document ALL features in web app that are missing from desktop app

---

## 🔴 CRITICAL MISSING FEATURES (Required for E2E tests to pass)

### 1. **Multi-Model Query Execution** ❌
**Web App**: 
- Sends same query to multiple AI models simultaneously
- Shows results side-by-side for comparison
- Supports OpenAI, Claude, Gemini, Grok, Ollama

**Desktop App**: 
- Has workflow builder UI
- But NO actual API execution implemented
- WorkflowExecutor exists but is mocked/simulated

**Files to check**: 
- Web: `frontend/index.html` (analyzeText function)
- Desktop: `src/services/workflowExecutor.ts` (only simulations)

### 2. **API Key Management UI** ❌
**Web App**:
- Collapsible API Settings section
- Input fields for each provider's API key
- Model selection dropdowns per provider
- Keys saved to localStorage

**Desktop App**:
- No API key input UI
- No settings panel
- Can't configure models

**Required for tests**: mvp-critical.spec.ts expects API configuration

### 3. **Text Input & File Upload** ❌
**Web App**:
- Large textarea for text input
- Multiple file upload with drag & drop
- File content extraction and display
- Character/word/token counters

**Desktop App**:
- Input nodes exist but no actual text input UI
- No file upload capability
- No content extraction

### 4. **Results Display Panel** ❌
**Web App**:
- Response cards for each model
- Syntax highlighting with Prism.js
- Copy button per response
- Token usage display
- Response time tracking

**Desktop App**:
- ExecutionPanel component exists
- But doesn't display actual API responses
- No syntax highlighting
- No copy functionality

### 5. **Query History** ❌
**Web App**:
- Searchable history with IndexedDB
- Load previous queries
- Clear history function

**Desktop App**:
- No history implementation
- No search functionality

### 6. **Ollama Integration** ⚠️ Partial
**Web App**:
- Detects local Ollama installation
- Lists available models
- Refresh models button
- Executes queries against Ollama

**Desktop App**:
- Has Ollama node type
- But no actual Ollama API calls
- No model detection

### 7. **Backend Restart Button** ❌
**Web App**:
- Restart backend button
- Health check polling
- Visual feedback during restart

**Desktop App**:
- No restart capability
- Basic health check only

### 8. **Dark Mode Toggle** ✅ WORKS
**Web App**: Toggle in header
**Desktop App**: Has dark mode toggle (verified working)

### 9. **Validation & Error Handling** ⚠️ Partial
**Web App**:
- Validates API keys before sending
- Shows specific error messages
- Handles rate limits, timeouts

**Desktop App**:
- Has validation UI elements
- But validation logic incomplete
- Error boundaries exist

### 10. **Workflow Builder** ✅ Different Implementation
**Web App**:
- Uses Drawflow library
- Vanilla JavaScript
- Different node types

**Desktop App**:
- Uses React Flow (better)
- TypeScript
- More node types
- This part actually works!

---

## 📊 Feature Status Summary

| Feature | Web App | Desktop App | Priority |
|---------|---------|-------------|----------|
| Multi-model execution | ✅ Works | ❌ Mocked | CRITICAL |
| API key configuration | ✅ Full UI | ❌ Missing | CRITICAL |
| Text/file input | ✅ Complete | ❌ Missing | CRITICAL |
| Results display | ✅ Full | ❌ Missing | CRITICAL |
| Query history | ✅ IndexedDB | ❌ Missing | HIGH |
| Ollama support | ✅ Works | ❌ Mocked | HIGH |
| Backend restart | ✅ Works | ❌ Missing | MEDIUM |
| Dark mode | ✅ Works | ✅ Works | DONE |
| Error handling | ✅ Complete | ⚠️ Partial | HIGH |
| Workflow builder | ✅ Drawflow | ✅ React Flow | DONE |

---

## 🛠️ Implementation Plan

### Phase 1: Core Functionality (Make basic E2E tests pass)
1. **API Configuration UI**
   - Add settings panel with API key inputs
   - Add model selection dropdowns
   - Save to localStorage
   - *Tests affected*: workflow-integration.spec.ts (API tests)

2. **Real API Execution**
   - Replace mocked WorkflowExecutor with real API calls
   - Implement llm_providers integration
   - Handle responses properly
   - *Tests affected*: mvp-critical.spec.ts (execution tests)

3. **Input/Output UI**
   - Add text input to Input nodes
   - Add results display to Output nodes
   - Implement syntax highlighting
   - *Tests affected*: workflow.spec.ts (basic workflow)

### Phase 2: Ollama & Advanced Features
4. **Ollama Integration**
   - Detect local Ollama
   - List models
   - Execute against Ollama
   - *Tests affected*: ollama-integration.spec.ts (all 5 tests)

5. **History & Persistence**
   - Implement query history
   - Add search functionality
   - *Tests affected*: mvp-critical.spec.ts (persistence tests)

### Phase 3: Polish
6. **File Upload**
   - Add drag & drop
   - Extract content
   - *Tests affected*: edge-cases.spec.ts (large input tests)

7. **Error Handling**
   - Comprehensive error messages
   - Rate limit handling
   - Timeout management
   - *Tests affected*: edge-cases.spec.ts (error scenarios)

---

## 📝 Critical Code Sections to Port

### From Web App (`frontend/index.html`):

1. **analyzeText() function** (lines ~2900-3200)
   - Sends to multiple APIs
   - Handles responses
   - Updates UI

2. **API configuration** (lines ~1500-1600)
   - Save/load API keys
   - Model selection

3. **Ollama integration** (lines ~1117-1300)
   - Model detection
   - API calls

4. **File handling** (lines ~3500-3700)
   - Upload processing
   - Content extraction

### To Desktop App:

1. **src/services/workflowExecutor.ts**
   - Replace simulations with real API calls
   - Use backend endpoints

2. **src/components/ui/SettingsPanel.tsx** (CREATE)
   - API key inputs
   - Model selection

3. **src/components/nodes/InputNode.tsx**
   - Add actual text input
   - File upload

4. **src/components/nodes/OutputNode.tsx**
   - Display real results
   - Syntax highlighting

---

## 🎯 Success Metrics

When complete, ALL 52 E2E tests should pass:
- workflow.spec.ts: 8/8 ✅
- drag-drop.spec.ts: 10/10 ✅
- mvp-critical.spec.ts: 7/7 ✅
- ollama-integration.spec.ts: 5/5 ✅
- edge-cases.spec.ts: 14/14 ✅
- workflow-integration.spec.ts: 11/11 ✅

Current status: ~2/52 passing (4%)

---

## 🚨 Key Insights

1. **The desktop app has a nice UI shell but no core functionality**
2. **The web app has all the functionality but older UI**
3. **We need to port the LOGIC from web to desktop, not the UI**
4. **The backend API exists and works - we just need to connect to it**
5. **Most E2E tests fail because they expect features that don't exist**

---

## Next Steps

1. Start with API configuration UI (without this, nothing works)
2. Implement real API execution (core functionality)
3. Add input/output UI (to see it working)
4. Then tackle advanced features

This will get us from 4% to 100% E2E test passing.