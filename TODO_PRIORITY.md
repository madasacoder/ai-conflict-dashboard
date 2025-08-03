# Priority TODO List - AI Conflict Dashboard

## 🔴 CRITICAL - Fix Today

### 1. BUG-027: Fix Workflow Builder Load Error
**Time**: 2 hours  
**Why**: Core feature completely broken, user-facing
- [ ] Open browser console, document exact errors
- [ ] Check if Drawflow CDN is loading
- [ ] Fix JavaScript errors
- [ ] Test basic node creation works
- [ ] Update bug status

### 2. BUG-028: Fix Ollama Integration
**Time**: 2 hours  
**Why**: User reported, Ollama IS running but shows error
- [ ] Test Ollama directly: `curl http://localhost:11434/api/tags`
- [ ] Check our endpoint: `curl http://localhost:8000/api/ollama/models`
- [ ] Fix error handling to show real message
- [ ] Test with actual Ollama model
- [ ] Update bug status

### 3. BUG-029: Fix Test Infrastructure  
**Time**: 3 hours  
**Why**: Cannot verify any fixes without working tests
- [ ] Fix missing 'client' fixture in pytest
- [ ] Get tests to run (even if failing)
- [ ] Generate accurate coverage report
- [ ] Create TEST_STATUS.md with categories
- [ ] Update bug status

---

## 🟡 HIGH - Fix This Week

### 4. Fix Security Test Failures
**Time**: 4 hours  
**Why**: Security must work correctly
- [ ] Fix circuit breaker isolation (BUG-001)
- [ ] Fix rate limiting (BUG-003)
- [ ] Ensure API keys not logged
- [ ] All security tests must pass

### 5. Consolidate Workflow Builders (BUG-030)
**Time**: 6 hours  
**Why**: Three implementations is two too many
- [ ] Test all three versions
- [ ] Choose the most stable
- [ ] Delete the others
- [ ] Add basic tests
- [ ] Update documentation

### 6. Fix Core API Tests
**Time**: 4 hours  
**Why**: Core functionality must be verified
- [ ] Fix /api/analyze tests
- [ ] Fix /api/ollama/models tests  
- [ ] Fix /api/workflows/execute tests
- [ ] Achieve >80% coverage on these endpoints

---

## 🟢 MEDIUM - Next Sprint

### 7. Desktop App Stability
**Time**: 8 hours  
**Why**: Complete the MVP
- [ ] Implement click-to-add (not drag-drop)
- [ ] Fix workflow execution
- [ ] Add result display
- [ ] Basic save/load

### 8. E2E Test Suite
**Time**: 8 hours  
**Why**: Prevent regression
- [ ] Setup Playwright properly
- [ ] Test critical user journeys
- [ ] Add to CI/CD pipeline
- [ ] Document test scenarios

### 9. Documentation Truth
**Time**: 6 hours  
**Why**: Stop the lies
- [ ] Update all metrics to reality
- [ ] Remove false claims
- [ ] Document known issues
- [ ] Clear architecture diagram

---

## Daily Checklist

Every day before starting:
1. [ ] Check DAILY_STATUS.md
2. [ ] Review this priority list
3. [ ] Pick top uncompleted task

Every day before ending:
1. [ ] Update DAILY_STATUS.md
2. [ ] Update bug statuses
3. [ ] Commit all changes
4. [ ] Test manually what you built

---

## Success Metrics This Week

By end of week, we must have:
- [ ] Workflow builder working (BUG-027) ✅
- [ ] Ollama integration fixed (BUG-028) ✅
- [ ] Tests running (BUG-029) ✅
- [ ] One workflow builder implementation (BUG-030) ✅
- [ ] Accurate documentation ✅

---

## What We're NOT Doing

To maintain focus:
- ❌ Adding new features
- ❌ Refactoring working code
- ❌ Perfectionism
- ❌ 90% test coverage
- ❌ Starting over

We're fixing what's broken and shipping working software.