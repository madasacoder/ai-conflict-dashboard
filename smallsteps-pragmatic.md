# AI Conflict Dashboard - Pragmatic Quality Plan

## Current Honest Status (2025-08-02)

### What Actually Works:
- ✅ Main web app runs and users can analyze text
- ✅ Backend serves API requests  
- ✅ Multiple LLM providers integrated
- ✅ File upload works
- ✅ Dark mode works

### What's Actually Broken:
- ❌ Workflow builder: JavaScript errors on page load
- ❌ Ollama integration: Shows "error" despite Ollama running
- ❌ Test coverage: 31% actual (not 92% claimed)
- ❌ Test suite: 65 failed, 79 passed, 10 errors
- ❌ Desktop app: Drag-drop issues

### Why We Got Here:
1. **No systematic bug tracking** - Issues got lost
2. **Rushed features without tests** - Technical debt accumulated
3. **False documentation** - Claims didn't match reality
4. **No definition of "done"** - Features shipped half-working

## New Core Principles

1. **Track Everything**: Every bug goes in BUGS.md
2. **Test What Matters**: User-facing features get tests
3. **Ship When Ready**: Not before, not perfect, but working
4. **Daily Status Updates**: Know exactly where we are
5. **No Lies**: If it's broken, we say it's broken

---

## Phase 0: Stop the Bleeding (Days 1-2)

### Day 1: Fix User-Facing Bugs

#### Task 0.1: Fix Workflow Builder Load Error
**Time**: 2 hours  
**Bug**: BUG-027

```
Current Status:
- Page loads but shows error
- Console errors need investigation
- Three different implementations exist

Steps:
1. Open browser console, document exact errors
2. Check if Drawflow CDN is loading
3. Fix JavaScript errors
4. Test basic node creation
5. Update BUG-027 status

Definition of Done:
- [ ] Page loads without console errors
- [ ] Can add at least one node
- [ ] Can connect two nodes
- [ ] Changes saved to localStorage
```

#### Task 0.2: Fix Ollama Integration  
**Time**: 2 hours
**Bug**: BUG-028

```
Current Status:
- Ollama is running locally
- API shows "error" not specific message
- /api/ollama/models endpoint exists

Steps:
1. Test Ollama directly: curl http://localhost:11434/api/tags
2. Check our API: curl http://localhost:8000/api/ollama/models
3. Fix error handling to show real message
4. Test with actual model
5. Update BUG-028 status

Definition of Done:
- [ ] Shows available Ollama models
- [ ] Can run analysis with Ollama
- [ ] Proper error messages if Ollama is down
- [ ] Works alongside other providers
```

### Day 2: Critical Test Fixes

#### Task 0.3: Fix Test Infrastructure
**Time**: 3 hours
**Bug**: BUG-029

```
Current Status:
- pytest has fixture errors
- Many tests fail due to infrastructure

Steps:
1. Fix missing 'client' fixture
2. Get accurate coverage report
3. Categorize test failures
4. Document in TEST_STATUS.md

Definition of Done:
- [ ] All tests run (even if failing)
- [ ] Accurate coverage percentage
- [ ] TEST_STATUS.md created with categories
- [ ] No infrastructure errors
```

#### Task 0.4: Create Bug Tracking System
**Time**: 1 hour

```
Deliverables:
1. Update BUGS.md with all known issues
2. Create DAILY_STATUS.md template
3. Create TODO_PRIORITY.md
4. Set up bug numbering system

Definition of Done:
- [ ] Every known bug has a number
- [ ] Bugs have priority levels
- [ ] Clear next steps documented
```

---

## Phase 1: Core Stability (Days 3-7)

### Day 3-4: Fix High-Priority Bugs

#### Task 1.1: Fix Security Test Failures
**Time**: 4 hours
**Bug**: BUG-001, BUG-003

```
Must Fix:
1. Circuit breaker isolation
2. Rate limiting too aggressive
3. API key logging

Definition of Done:
- [ ] Security tests pass
- [ ] No API keys in logs
- [ ] Rate limiting works correctly
- [ ] Each user isolated
```

#### Task 1.2: Fix Core API Tests
**Time**: 4 hours
**Bug**: Various

```
Priority Endpoints:
1. POST /api/analyze
2. GET /api/ollama/models
3. POST /api/workflows/execute

Definition of Done:
- [ ] Core endpoints have >80% test coverage
- [ ] All tests passing for these endpoints
- [ ] Error cases handled
```

### Day 5-7: Consolidate and Document

#### Task 1.3: Consolidate Workflow Builders
**Time**: 6 hours
**Bug**: BUG-030

```
Current State:
- workflow-builder.html (Drawflow)
- workflow-builder-simple.html (Vanilla)
- workflow-basic.html (Test)

Decision Process:
1. Test all three implementations
2. Pick the most stable
3. Delete the others
4. Add tests for chosen solution

Definition of Done:
- [ ] One workflow builder remains
- [ ] Has basic test coverage
- [ ] No duplicate code
- [ ] Clear documentation
```

---

## Phase 2: Feature Completion (Week 2)

### Task 2.1: Complete Workflow Builder
**Time**: 8 hours

```
Features Needed:
1. Reliable node creation (click-to-add)
2. Node configuration panels
3. Save/load workflows
4. Execute workflows
5. Display results

Definition of Done:
- [ ] Each feature has tests
- [ ] No console errors
- [ ] Works in Chrome/Safari/Firefox
- [ ] User can complete full workflow
```

### Task 2.2: Desktop App Stability
**Time**: 8 hours

```
Fix Priority:
1. Click-to-add nodes (not drag-drop)
2. Basic workflow execution
3. Results display
4. Save/load locally

Definition of Done:
- [ ] App launches without errors
- [ ] Can create simple workflow
- [ ] Can execute workflow
- [ ] Results display correctly
```

---

## Phase 3: Quality Assurance (Week 3)

### Task 3.1: End-to-End Test Suite
**Time**: 8 hours

```
Critical User Journeys:
1. First-time user setup
2. Create and run analysis
3. Compare multiple models
4. Create workflow
5. Execute workflow

Definition of Done:
- [ ] Playwright tests for each journey
- [ ] Tests run in CI/CD
- [ ] All tests passing
```

### Task 3.2: Performance Testing
**Time**: 4 hours

```
Benchmarks:
1. Page load time < 2 seconds
2. API response < 3 seconds
3. Workflow execution feedback < 500ms
4. Memory usage stable

Definition of Done:
- [ ] Performance benchmarks documented
- [ ] All benchmarks passing
- [ ] No memory leaks
```

---

## Daily Status Template

```markdown
## Daily Status: [DATE]

### Completed Today:
- [ ] Task X.X: [What was done]
- [ ] Bug-XXX: [Status update]

### Blocked:
- [ ] Issue: [What's blocking]

### Tomorrow's Priority:
1. [Most important task]
2. [Second priority]

### Metrics:
- Test Coverage: XX% (was XX%)
- Passing Tests: XX/XX (was XX/XX)
- Open Bugs: XX (was XX)
- Console Errors: XX (was XX)
```

---

## Bug Tracking Format

```markdown
### BUG-XXX: [Clear Description]
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Status**: OPEN/IN_PROGRESS/FIXED/VERIFIED
- **Component**: [Where it occurs]
- **Discovered**: [Date]
- **Description**: [What's broken]
- **Steps to Reproduce**: [How to see it]
- **Expected**: [What should happen]
- **Actual**: [What does happen]
- **Fix**: [How we fixed it]
- **Tests**: [What tests verify the fix]
- **Verified**: [Date tested working]
```

---

## Success Metrics

### Week 1 Success:
- [ ] Workflow builder loads without errors
- [ ] Ollama integration works
- [ ] Test infrastructure fixed
- [ ] All bugs tracked in BUGS.md
- [ ] Daily status updates happening

### Week 2 Success:
- [ ] One working workflow builder
- [ ] Desktop app functional
- [ ] Core API tests passing
- [ ] No console errors in production

### Week 3 Success:
- [ ] E2E tests covering critical paths
- [ ] Performance benchmarks met
- [ ] Test coverage >60% (honest)
- [ ] Zero critical bugs
- [ ] Documentation accurate

---

## Definition of "Bug-Free"

A bug-free app means:
1. **No console errors** in normal use
2. **All user journeys completable**
3. **Errors show helpful messages**
4. **No data loss**
5. **No security vulnerabilities**
6. **Performance meets benchmarks**
7. **Works on supported browsers**

NOT required for "bug-free":
- 100% test coverage
- Perfect code
- Every edge case handled
- No technical debt

---

## Commitment

Every day we will:
1. Update DAILY_STATUS.md
2. Update bug status in BUGS.md
3. Run tests before marking "done"
4. Test manually in browser
5. Be honest about problems

No more:
- Claiming false metrics
- Shipping broken features
- Ignoring test failures
- Lost bugs
- Vaporware

This plan focuses on WORKING SOFTWARE with PRAGMATIC QUALITY.