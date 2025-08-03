# AI Conflict Dashboard - Realistic Test-Driven Recovery Plan

## Current Reality Check

After comprehensive code review:
- **Backend Test Coverage**: 31% (not 92% as claimed)
- **Test Status**: 65 failed, 79 passed, 10 errors
- **Frontend Tests**: Not running (vitest not installed)
- **Desktop Tests**: Minimal (2 test files)
- **Architecture**: Fragmented with multiple implementations

## Core Philosophy: Fix Foundation, Then Build

1. **Acknowledge Reality**: We have broken tests and false metrics
2. **Fix Before Feature**: No new features until tests pass
3. **Small Steps**: 2-4 hour tasks maximum
4. **Truth in Documentation**: Update claims to match reality

---

## Phase 0: Emergency Stabilization (Week 1)

### Task 0.1: Fix Test Infrastructure
**Time**: 4 hours  
**Priority**: CRITICAL

**Objective**: Get accurate test metrics and fix test runner

**Implementation**:
```
As a developer who needs reliable tests,
fix the test infrastructure to run correctly.

Deliverables:
1. Fix pytest fixture errors (client fixture missing)
2. Install vitest for frontend
3. Setup proper test configuration
4. Get accurate coverage reports
5. Document actual vs claimed metrics

Output: All tests run (even if failing)
```

**Tests Required**:
```
Success Criteria:
- pytest runs without fixture errors
- npm test works in frontend
- Coverage reports are accurate
- No false positive tests
```

### Task 0.2: Triage Test Failures
**Time**: 4 hours  
**Priority**: CRITICAL

**Objective**: Categorize and prioritize test failures

**Implementation**:
```
As a developer fixing a broken test suite,
categorize all failures by severity.

Categories:
1. Security test failures (CRITICAL)
2. Core functionality failures (HIGH)
3. Integration test failures (MEDIUM)
4. Edge case failures (LOW)

Deliverables:
1. TEST_TRIAGE.md with all failures listed
2. Root cause for each failure category
3. Fix order priority list
4. Quick wins identified

Output: Clear roadmap to green tests
```

### Task 0.3: Fix Security Test Failures
**Time**: 4 hours  
**Priority**: CRITICAL

**Objective**: Security tests must pass

**Implementation**:
```
As a security-conscious developer,
fix all security-related test failures.

Focus areas:
1. API key sanitization tests
2. Rate limiting tests (too aggressive)
3. Circuit breaker isolation
4. XSS protection validation

Output: 100% security tests passing
```

**Tests Required**:
```
Unit Tests:
1. API keys never logged
2. Rate limits work correctly
3. Circuit breakers isolate by key
4. XSS attempts blocked

Success Criteria:
- Zero security test failures
- No sensitive data leaks
- Proper error messages
```

---

## Phase 1: Core Functionality Recovery (Week 2)

### Task 1.1: Fix Backend Core Tests
**Time**: 6 hours  
**Priority**: HIGH

**Objective**: Main API functionality must work

**Implementation**:
```
As a developer needing a working API,
fix core endpoint test failures.

Priority order:
1. /api/analyze endpoint tests
2. LLM provider tests
3. Token counting tests
4. Error handling tests

Deliverables:
1. All API integration tests pass
2. Provider circuit breakers work
3. Token limits enforced correctly
4. Errors return proper status codes

Output: Backend MVP functional
```

**Tests Required**:
```
Integration Tests:
1. Multi-model analysis works
2. File upload processes correctly
3. Long text gets chunked
4. API keys validated

Edge Cases:
1. Missing API keys
2. Invalid model names
3. Oversized inputs
4. Concurrent requests

Success Criteria:
- Core API tests: 100% pass
- Coverage: >80% for critical paths
```

### Task 1.2: Fix Frontend Functionality
**Time**: 6 hours  
**Priority**: HIGH

**Objective**: Web app works without console errors

**Implementation**:
```
As a user of the web interface,
ensure all features work correctly.

Fix order:
1. Workflow builder JavaScript errors
2. Ollama integration
3. File upload edge cases
4. Dark mode persistence

Deliverables:
1. No console errors on any page
2. All buttons/features functional
3. Proper error messages
4. State persists correctly

Output: Usable web interface
```

**Tests Required**:
```
E2E Tests (Playwright):
1. Complete analysis flow
2. File upload journey
3. Workflow builder basics
4. Settings persistence

Manual Tests:
1. Cross-browser check
2. Mobile responsiveness
3. Offline behavior
4. Error recovery

Success Criteria:
- Zero console errors
- All features accessible
- Graceful error handling
```

### Task 1.3: Consolidate Implementations
**Time**: 8 hours  
**Priority**: HIGH

**Objective**: Remove duplicate code

**Implementation**:
```
As a maintainer wanting clean code,
consolidate duplicate implementations.

Consolidation targets:
1. One workflow builder (not 3)
2. Shared backend code
3. Common error handling
4. Unified test utilities

Deliverables:
1. SHARED_CODE.md strategy
2. Removed duplicate files
3. DRY principle applied
4. Clear module structure

Output: Maintainable codebase
```

---

## Phase 2: Desktop App Stabilization (Week 3)

### Task 2.1: Desktop Integration Tests
**Time**: 6 hours  
**Priority**: MEDIUM

**Objective**: Desktop app basic functionality

**Implementation**:
```
As a desktop app developer,
ensure Tauri integration works.

Test areas:
1. Backend API communication
2. SQLite operations
3. File system access
4. Window management

Deliverables:
1. Integration test suite
2. IPC communication tests
3. Database migration tests
4. Cross-platform checks

Output: Reliable desktop foundation
```

### Task 2.2: Fix Drag-and-Drop Properly
**Time**: 4 hours  
**Priority**: MEDIUM

**Objective**: Reliable node manipulation

**Implementation**:
```
As a user building workflows,
make drag-and-drop intuitive and reliable.

Approach:
1. Use click-to-add as primary
2. Drag-and-drop as enhancement
3. Clear visual feedback
4. Undo/redo support

Output: Smooth workflow building
```

---

## Phase 3: True Test Coverage (Week 4)

### Task 3.1: Unit Test Coverage
**Time**: 8 hours  
**Priority**: MEDIUM

**Objective**: Achieve real 80% coverage

**Implementation**:
```
As a developer wanting confidence,
write comprehensive unit tests.

Focus areas:
1. Utility functions (100%)
2. API client (90%)
3. State management (90%)
4. UI components (80%)

Output: Actual high coverage
```

### Task 3.2: Performance Testing
**Time**: 4 hours  
**Priority**: LOW

**Objective**: Establish baselines

**Implementation**:
```
Performance benchmarks:
1. API response times
2. UI render performance
3. Memory usage patterns
4. Bundle size limits

Output: Performance dashboard
```

---

## Phase 4: Documentation Truth (Week 5)

### Task 4.1: Update All Documentation
**Time**: 6 hours  
**Priority**: HIGH

**Objective**: Documentation matches reality

**Implementation**:
```
Updates needed:
1. Real test coverage numbers
2. Actual feature status
3. Known issues list
4. Accurate architecture

Output: Truthful documentation
```

---

## Success Metrics

### Week 1: Foundation
- [ ] All tests run without infrastructure errors
- [ ] Security tests 100% passing
- [ ] Accurate coverage reporting

### Week 2: Functionality  
- [ ] Backend core tests >80% passing
- [ ] Zero console errors in web app
- [ ] No duplicate implementations

### Week 3: Desktop
- [ ] Desktop app launches reliably
- [ ] Basic workflow creation works
- [ ] Cross-platform tested

### Week 4: Quality
- [ ] Real 80% test coverage achieved
- [ ] Performance benchmarks established
- [ ] All critical bugs fixed

### Week 5: Truth
- [ ] Documentation accurate
- [ ] No false claims
- [ ] Clear roadmap forward

---

## Key Principles

1. **No Lies**: If tests fail, we say they fail
2. **Fix First**: Broken tests before new features
3. **Small Steps**: Every task completable in <4 hours
4. **User Focus**: Working software over perfect tests
5. **Incremental**: Each phase builds on previous

---

## Anti-Patterns to Avoid

1. **Claiming false metrics**: No more "92% coverage" lies
2. **Skipping tests**: Every feature needs tests
3. **Big bang refactors**: Small, incremental changes
4. **Feature creep**: Fix foundation first
5. **Perfect over done**: Ship working software

This plan acknowledges our real situation and provides a path to stability through small, testable steps.