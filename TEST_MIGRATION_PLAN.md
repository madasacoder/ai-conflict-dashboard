# 🔄 Test Migration Plan - AI Conflict Dashboard

## Executive Summary

Following the major architectural unification (merging `frontend` and `desktop-app` into `ui`), all tests need to be updated to reflect the new React/Vite/TypeScript stack. This plan outlines the systematic migration of tests to achieve Grade A quality while supporting the new unified architecture.

---

## 📊 Current State Analysis

### Architecture Changes
1. **Frontend Migration**: Vanilla JS → React + TypeScript + Vite
2. **Codebase Unification**: `frontend` + `desktop-app` → `ui`
3. **State Management**: LocalStorage → Zustand store
4. **Build System**: Static HTML → Vite bundler
5. **Component Architecture**: jQuery-style → React components

### Test Impact Assessment
- **Backend Tests**: 324 tests, 56 failing (need API endpoint updates)
- **Frontend Tests**: Legacy tests obsolete, need React Testing Library migration
- **UI Tests**: New tests needed for React components and Zustand store
- **E2E Tests**: Playwright tests need URL and selector updates

---

## 🎯 Migration Objectives

### Primary Goals
1. **Achieve 95% test coverage** for the unified codebase
2. **Fix all 56 failing backend tests**
3. **Migrate legacy frontend tests to React Testing Library**
4. **Update E2E tests for new UI structure**
5. **Implement Grade A test quality** per F.I.R.S.T. principles

### Success Criteria
- ✅ Zero failing tests
- ✅ All tests run in < 5 seconds (except E2E)
- ✅ No test interdependencies
- ✅ Complete mock elimination where possible
- ✅ Business value focus in all tests

---

## 📋 Migration Tasks

### Phase 1: Backend Test Fixes (Week 1)

#### 1.1 Fix Failing Tests (Priority: CRITICAL)
```python
# Current Issues to Fix:
- Circuit breaker race conditions (test_regression_all_bugs.py)
- API endpoint mismatches (test_api_analyze.py)
- Timeout handling issues (test_timeout_handler.py)
- Mock/real implementation conflicts (test_llm_providers.py)
```

#### 1.2 Update API Tests
```python
# Update endpoints for new architecture
OLD: /analyze
NEW: /api/analyze

OLD: /workflow/execute
NEW: /api/workflows/execute

# Add new endpoints
/api/workflows/save
/api/workflows/load
/api/health
```

#### 1.3 Remove Obsolete Tests
- Remove tests for deprecated vanilla JS functions
- Remove tests for old frontend structure
- Clean up duplicate test files

---

### Phase 2: Frontend Test Migration (Week 2)

#### 2.1 Migrate Component Tests

**Old (Vanilla JS):**
```javascript
// frontend/tests/utils.test.js
describe('syncModelSelections', () => {
  it('should sync settings dropdown to display dropdown', () => {
    document.getElementById('openaiModel').value = 'gpt-4';
    syncModelSelections();
    expect(displayDropdown.value).toBe('gpt-4');
  });
});
```

**New (React Testing Library):**
```typescript
// ui/src/components/__tests__/ModelSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelector } from '../ModelSelector';
import { useUIStore } from '@/state/uiStore';

describe('ModelSelector', () => {
  it('should update store when model is selected', async () => {
    render(<ModelSelector />);
    
    const select = screen.getByLabelText('OpenAI Model');
    fireEvent.change(select, { target: { value: 'gpt-4' } });
    
    expect(useUIStore.getState().selectedModels.openai).toBe('gpt-4');
  });
});
```

#### 2.2 Create New Component Tests

Required test files:
```
ui/src/components/__tests__/
├── InputSection.test.tsx
├── ResultsSection.test.tsx
├── Button.test.tsx
├── TextArea.test.tsx
└── ErrorBoundary.test.tsx
```

#### 2.3 Migrate State Tests

**Old (LocalStorage):**
```javascript
localStorage.setItem('openaiKey', 'sk-test');
expect(localStorage.getItem('openaiKey')).toBe('sk-test');
```

**New (Zustand):**
```typescript
import { useUIStore } from '@/state/uiStore';

const { setApiKey, apiKeys } = useUIStore.getState();
setApiKey('openai', 'sk-test');
expect(apiKeys.openai).toBe('sk-test');
```

---

### Phase 3: E2E Test Updates (Week 3)

#### 3.1 Update Playwright Tests

**Selector Updates:**
```typescript
// Old selectors
await page.click('#launchWorkflowBuilder');
await page.fill('#openaiKey', 'test-key');

// New selectors
await page.click('[data-testid="launch-workflow-builder"]');
await page.fill('[data-testid="openai-api-key-input"]', 'test-key');
```

#### 3.2 Update Test URLs
```typescript
// Old
await page.goto('http://localhost:8080');

// New
await page.goto('http://localhost:5173');
```

#### 3.3 Fix Workflow Tests
- Update node creation tests for React Flow v11
- Fix drag-and-drop tests with new event system
- Update connection tests for new edge handling

---

### Phase 4: Test Quality Improvements (Week 4)

#### 4.1 Implement F.I.R.S.T. Principles

**Fast Tests:**
```typescript
// Remove all sleep/setTimeout
// Use waitFor instead of arbitrary delays
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, { timeout: 1000 });
```

**Independent Tests:**
```typescript
// Each test creates its own data
beforeEach(() => {
  // Reset store to initial state
  useUIStore.setState(initialState);
  // Clear all mocks
  vi.clearAllMocks();
});
```

**Repeatable Tests:**
```typescript
// Mock time-dependent functions
vi.setSystemTime(new Date('2024-01-01'));
// Mock random values
vi.spyOn(Math, 'random').mockReturnValue(0.5);
```

#### 4.2 Remove Excessive Mocking

**Before:**
```typescript
// Over-mocked
const mockFetch = vi.fn();
global.fetch = mockFetch;
mockFetch.mockResolvedValue({ ok: true, json: () => ({ data: 'test' }) });
```

**After:**
```typescript
// Use MSW for realistic API mocking
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/analyze', (req, res, ctx) => {
    return res(ctx.json({ responses: [...] }));
  })
);
```

#### 4.3 Add Missing Test Categories

**Security Tests:**
```typescript
describe('Security', () => {
  it('should sanitize user input to prevent XSS', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    render(<InputSection />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: maliciousInput } });
    
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });
});
```

**Accessibility Tests:**
```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(<WorkflowBuilder />);
    
    expect(screen.getByLabelText('Add new node')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Execute workflow' })).toBeInTheDocument();
  });
});
```

**Performance Tests:**
```typescript
describe('Performance', () => {
  it('should render 100 nodes without lag', () => {
    const startTime = performance.now();
    
    const nodes = Array.from({ length: 100 }, (_, i) => ({
      id: `node-${i}`,
      type: 'llm',
      position: { x: i * 50, y: i * 50 }
    }));
    
    render(<WorkflowBuilder initialNodes={nodes} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in < 100ms
  });
});
```

---

## 🛠️ Implementation Strategy

### Week 1: Backend Stabilization
- [ ] Fix 56 failing tests
- [ ] Update API endpoint tests
- [ ] Remove obsolete tests
- [ ] Run: `pytest --cov=. --cov-fail-under=90`

### Week 2: Frontend Migration
- [ ] Set up React Testing Library
- [ ] Migrate existing tests
- [ ] Create component tests
- [ ] Run: `npm test -- --coverage`

### Week 3: E2E Updates
- [ ] Update Playwright selectors
- [ ] Fix workflow tests
- [ ] Add new user journey tests
- [ ] Run: `npm run test:e2e`

### Week 4: Quality Enhancement
- [ ] Implement F.I.R.S.T. principles
- [ ] Add security tests
- [ ] Add accessibility tests
- [ ] Add performance tests
- [ ] Achieve Grade A quality

---

## 📊 Success Metrics

### Coverage Targets
| Component | Current | Target | Required Tests |
|-----------|---------|--------|----------------|
| Backend | 81% | 95% | +45 tests |
| UI Components | 0% | 95% | +50 tests |
| State Management | 0% | 100% | +15 tests |
| E2E Workflows | 60% | 90% | +10 tests |

### Quality Metrics
- **Test Execution Time**: < 30 seconds for full suite
- **Flaky Test Rate**: 0%
- **Mock Usage**: < 20% of tests
- **Business Value Coverage**: 100% of critical paths

---

## 🚀 Quick Start Commands

```bash
# Backend Tests
cd backend
source venv/bin/activate
pytest -xvs  # Run with verbose output

# UI Unit Tests
cd ui
npm test -- --run  # Run once
npm test -- --watch  # Watch mode
npm test -- --coverage  # With coverage

# E2E Tests
cd ui
npm run test:e2e  # Headless
npm run test:e2e -- --ui  # With UI

# Full Test Suite
make test  # Run all tests
```

---

## 📝 Test File Templates

### React Component Test Template
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName />);
      expect(screen.getByTestId('component-name')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<ComponentName onClick={handleClick} />);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe('Business Logic', () => {
    it('should validate input correctly', () => {
      // Test actual business value
    });
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should complete user journey', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'test data');
    
    // Act
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toContainText('Success');
  });
});
```

---

## ⚠️ Critical Considerations

### Breaking Changes
1. **API Endpoints**: All `/analyze` → `/api/analyze`
2. **State Management**: localStorage → Zustand store
3. **Component Structure**: IDs → data-testid attributes
4. **Build Output**: `frontend/` → `ui/dist/`

### Migration Risks
- **Data Loss**: Backup all test data before migration
- **Coverage Drop**: Temporary coverage decrease during migration
- **CI/CD Impact**: Update all pipeline configurations

### Rollback Plan
1. Keep `frontend/` directory until migration complete
2. Tag current commit for easy rollback
3. Run parallel test suites during transition

---

## 📅 Timeline

| Week | Focus | Deliverables | Success Criteria |
|------|-------|--------------|------------------|
| 1 | Backend | Fixed tests | 0 failing tests |
| 2 | Frontend | React tests | 95% coverage |
| 3 | E2E | Updated tests | All journeys pass |
| 4 | Quality | Grade A tests | F.I.R.S.T. compliance |

---

## ✅ Checklist

### Pre-Migration
- [ ] Backup current test results
- [ ] Document all failing tests
- [ ] Create rollback branch
- [ ] Update CI/CD configs

### During Migration
- [ ] Fix backend tests first
- [ ] Migrate frontend incrementally
- [ ] Update E2E selectors
- [ ] Run tests continuously

### Post-Migration
- [ ] Verify 95% coverage
- [ ] Confirm 0 failing tests
- [ ] Update documentation
- [ ] Remove legacy code

---

## 🎯 Expected Outcomes

After completing this migration:
1. **Unified Test Suite**: Single source of truth for all tests
2. **Grade A Quality**: All tests meet F.I.R.S.T. principles
3. **95% Coverage**: Comprehensive test coverage
4. **Fast Feedback**: < 30 second test execution
5. **Production Ready**: Confidence in deployment

---

*Migration Plan Created: 2024*  
*Estimated Duration: 4 weeks*  
*Priority: CRITICAL - Tests currently failing*