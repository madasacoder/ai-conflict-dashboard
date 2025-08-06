# Desktop App Migration & Enhancement Plan

## Overview
This plan outlines the migration of tests from the web app and addition of missing features to achieve feature parity between the desktop and web applications.

## Part 1: Test Migration Priority

### CRITICAL PRIORITY - E2E Tests (Week 1)
These tests validate complete user workflows and should be migrated first:

#### 1. **Core Workflow E2E Tests** (Days 1-2)
From `/frontend/e2e/`:
- [ ] `workflow-builder-comprehensive.spec.js` → `/desktop-app/src/__tests__/e2e/WorkflowComprehensive.test.tsx`
- [ ] `workflow-full-pipeline.spec.js` → `/desktop-app/src/__tests__/e2e/WorkflowPipeline.test.tsx`
- [ ] `workflow-node-manipulation.spec.js` → `/desktop-app/src/__tests__/e2e/NodeManipulation.test.tsx`
- [ ] `basic-workflow-execution.spec.js` → `/desktop-app/src/__tests__/e2e/BasicExecution.test.tsx`

#### 2. **Translation Pipeline E2E Tests** (Days 3-4)
Critical for validating multi-step AI workflows:
- [ ] `execute-translation-pipeline.spec.js` → `/desktop-app/src/__tests__/e2e/TranslationPipeline.test.tsx`
- [ ] `ollama-translation-pipeline.spec.js` → `/desktop-app/src/__tests__/e2e/OllamaTranslation.test.tsx`
- [ ] `story-translation-pipeline.spec.js` → `/desktop-app/src/__tests__/e2e/StoryTranslation.test.tsx`
- [ ] `simple-chinese-translation.spec.js` → `/desktop-app/src/__tests__/e2e/ChineseTranslation.test.tsx`

#### 3. **Ollama Integration E2E Tests** (Day 5)
Essential for local AI model support:
- [ ] `workflow-builder-ollama.spec.js` → `/desktop-app/src/__tests__/e2e/OllamaIntegration.test.tsx`
- [ ] `simple-ollama-execution.spec.js` → `/desktop-app/src/__tests__/e2e/OllamaExecution.test.tsx`
- [ ] `verify-ollama-execution.spec.js` → `/desktop-app/src/__tests__/e2e/OllamaVerification.test.tsx`

#### 4. **Output & Display E2E Tests** (Day 6)
Validates results presentation:
- [ ] `test-output-display.spec.js` → `/desktop-app/src/__tests__/e2e/OutputDisplay.test.tsx`
- [ ] `verify-output-display.spec.js` → `/desktop-app/src/__tests__/e2e/OutputVerification.test.tsx`
- [ ] `test-connection-feedback.spec.js` → `/desktop-app/src/__tests__/e2e/ConnectionFeedback.test.tsx`

#### 5. **Regression E2E Test** (Day 7)
Prevents bug reoccurrence:
- [ ] `regression-all-bugs.spec.js` → `/desktop-app/src/__tests__/e2e/RegressionBugs.test.tsx`

### High Priority - Integration Tests (Week 2)
After E2E tests are working:

1. **API Integration Tests** (from `/frontend/tests/api.test.js`)
   - [ ] Create `/desktop-app/src/__tests__/integration/API.test.tsx`
   - [ ] Test multi-model API calls
   - [ ] Test error handling and retries

2. **Ollama Unit Tests** (from `/frontend/tests/workflow-builder-ollama.test.js`)
   - [ ] Create `/desktop-app/src/__tests__/integration/OllamaModels.test.tsx`
   - [ ] Test model loading and configuration

3. **Component Integration Tests**
   - [ ] Test data flow between components
   - [ ] Test state management integration

### Medium Priority - Unit Tests (Week 3)
4. **Utils and Helper Tests** (from `/frontend/tests/utils.test.js`)
   - [ ] Create `/desktop-app/src/__tests__/utils/`
   - [ ] Test text processing functions
   - [ ] Test file handling

5. **Regression Unit Tests** (from `/frontend/tests/regression-all-bugs.test.js`)
   - [ ] Create focused unit tests for each bug scenario

## Part 2: Missing Features Implementation

### Critical Features (Week 1-2)

#### 1. File Upload System
**Implementation Plan:**
```typescript
// Create: /desktop-app/src/components/FileUpload.tsx
- Drag & drop file upload component
- Multiple file selection
- File preview with metadata
- Duplicate detection and renaming
- Integration with InputNode
```

**Tasks:**
- [ ] Create FileUpload component
- [ ] Add file handling to workflowStore
- [ ] Update InputNode to support file input
- [ ] Add tests for file operations

#### 2. Real-time Text Statistics
**Implementation Plan:**
```typescript
// Create: /desktop-app/src/components/TextStatistics.tsx
- Character count display
- Token estimation (using tiktoken or similar)
- Token limit warnings
- Real-time updates
```

**Tasks:**
- [ ] Create TextStatistics component
- [ ] Add token counting utility
- [ ] Integrate with InputNode
- [ ] Add visual warnings for limits

#### 3. Comparison Engine
**Implementation Plan:**
```typescript
// Create: /desktop-app/src/utils/comparisonEngine.ts
- Port comparison logic from web app
- Line-by-line diff analysis
- Similarity scoring
- Consensus detection
- Conflict classification
```

**Tasks:**
- [ ] Port ComparisonEngine class
- [ ] Update CompareNode to use engine
- [ ] Add visual diff display
- [ ] Create comparison result component

### Important Features (Week 3)

#### 4. Side-by-Side Response Display
**Implementation Plan:**
```typescript
// Create: /desktop-app/src/components/ResponseDisplay.tsx
- Multi-column layout for responses
- Copy-to-clipboard functionality
- Syntax highlighting support
- Expandable/collapsible sections
```

**Tasks:**
- [ ] Create ResponseDisplay component
- [ ] Add to workflow results view
- [ ] Implement copy functionality
- [ ] Add syntax highlighting

#### 5. History Management
**Implementation Plan:**
```typescript
// Enhance: /desktop-app/src/state/workflowStore.ts
- Add history tracking
- Create history panel component
- Add restore functionality
- Persist to SQLite
```

**Tasks:**
- [ ] Extend workflowStore with history
- [ ] Create HistoryPanel component
- [ ] Add database schema for history
- [ ] Implement restore functionality

### Nice-to-Have Features (Week 4)

#### 6. Live Text Input Mode
- [ ] Create direct input mode alongside workflow mode
- [ ] Add quick analysis without building workflows
- [ ] Real-time results display

#### 7. Enhanced UI Features
- [ ] Implement dark mode
- [ ] Add Prism.js for syntax highlighting
- [ ] Improve styling with Tailwind
- [ ] Add keyboard shortcuts

## Part 3: Quality Improvements

### Code Quality Checks for Desktop App
1. **Run TypeScript strict mode**
   ```bash
   cd desktop-app
   npm run type-check
   ```

2. **Add ESLint configuration**
   ```bash
   npm install --save-dev eslint @typescript-eslint/parser
   npm run lint
   ```

3. **Add test coverage goals**
   - Target: 80% coverage minimum
   - Set up coverage reports

4. **Performance optimization**
   - Add React.memo where appropriate
   - Optimize re-renders
   - Add loading states

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up test infrastructure
2. Migrate critical tests
3. Implement file upload
4. Add text statistics

### Phase 2: Core Features (Week 2)
1. Port comparison engine
2. Migrate more tests
3. Add response display
4. Implement history

### Phase 3: Polish (Week 3)
1. Complete test migration
2. Add remaining features
3. UI improvements
4. Performance optimization

### Phase 4: Integration (Week 4)
1. Full integration testing
2. Bug fixes
3. Documentation
4. Release preparation

## Success Metrics
- [ ] 80%+ test coverage
- [ ] All 20 web app regression bugs have desktop tests
- [ ] Feature parity with web app
- [ ] Performance benchmarks met
- [ ] Zero critical bugs

## Next Steps
1. Create feature branch: `feat/desktop-web-parity`
2. Set up test infrastructure
3. Begin with file upload implementation
4. Daily progress tracking

This migration will bring the desktop app to feature parity with the web app while leveraging its superior architecture for better performance and maintainability.