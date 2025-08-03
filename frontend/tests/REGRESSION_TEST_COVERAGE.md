# Regression Test Coverage Matrix

This document maps all 20 bugs found during E2E testing to their corresponding regression tests.

## Bug-to-Test Mapping

| Bug # | Description                       | Status   | Test Location                  | Test Name                                 |
| ----- | --------------------------------- | -------- | ------------------------------ | ----------------------------------------- |
| 001   | Node Stacking Issue               | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #001: Node Stacking Issue`           |
| 002   | Config Panel Blocking             | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #002: Config Panel Blocking`         |
| 003   | Ollama Checkbox Missing           | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #003: Ollama Checkbox Missing`       |
| 004   | Navigation Away from Builder      | ✅ Fixed | Covered by Bug #002 test       | -                                         |
| 005   | Connection Creation Issues        | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #005: Connection Creation`           |
| 006   | Ollama Workflow Execution         | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #006: Ollama Workflow Execution`     |
| 007   | Wrong Port Configuration          | ✅ Fixed | Covered by framework init      | -                                         |
| 008   | Incorrect UI Selectors            | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #007-008: Correct Selectors`         |
| 009   | Config Panel Animation            | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #009: Config Panel Animation`        |
| 010   | Missing Ollama Model Directive    | ✅ Fixed | Covered by Bug #006 test       | -                                         |
| 011   | Config Panel Not Closing          | ✅ Fixed | Covered by Bug #002 test       | -                                         |
| 012   | Workflow Execution Not Triggering | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #012: Workflow Execution Triggering` |
| 013   | Connection Visual Feedback        | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #013: Connection Visual Feedback`    |
| 014   | Test Framework Memory Leaks       | ✅ Fixed | Framework cleanup in afterEach | -                                         |
| 015   | Workflow Executor Ollama Support  | ✅ Fixed | regression-all-bugs.spec.js    | Covered by Bug #006                       |
| 016   | API Not Being Called              | ✅ Fixed | Covered by Bug #012 test       | -                                         |
| 017   | Wrong API Port                    | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #017-018: API Endpoint and CORS`     |
| 018   | CORS Error                        | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #017-018: API Endpoint and CORS`     |
| 019   | GPT-4 Default Selected            | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #019: GPT-4 Not Default Selected`    |
| 020   | No Visual Output Display          | ✅ Fixed | regression-all-bugs.spec.js    | `Bug #020: Visual Output Display`         |

## Additional Regression Tests

### Critical Bug Prevention Tests

- **Node positioning remains stable**: Prevents Bug #001 regression
- **Config panel never blocks interactions**: Prevents Bug #002, #004, #011 regression
- **Ollama remains selectable option**: Prevents Bug #003 regression

### Integration Tests

- **Full Pipeline Smoke Test**: Validates entire workflow creation, connection, and structure
- **test-output-display.spec.js**: Validates Bug #020 fix with mock data
- **test-connection-visual-simple.spec.js**: Validates Bug #013 fix

## Test Execution

### Run All Regression Tests

```bash
npx playwright test e2e/regression-all-bugs.spec.js
```

### Run with Visual Feedback

```bash
npx playwright test e2e/regression-all-bugs.spec.js --headed
```

### Run Specific Bug Test

```bash
npx playwright test e2e/regression-all-bugs.spec.js -g "Bug #001"
```

## Coverage Summary

- **Total Bugs Found**: 20
- **Bugs with Direct Tests**: 14
- **Bugs Covered by Other Tests**: 6
- **Test Coverage**: 100%

All 20 bugs have either:

1. Direct regression tests that specifically check the bug fix
2. Are covered by related tests that would catch regression
3. Are prevented by framework improvements (e.g., memory leak prevention)

## Maintenance

When new bugs are found:

1. Add them to E2E_BUGS_FOUND.md
2. Create a specific regression test in regression-all-bugs.spec.js
3. Update this coverage matrix
4. Run the full regression suite to ensure no breakage

## Test Framework Features

The `WorkflowTestFramework` used in tests provides:

- Automatic node positioning (prevents stacking)
- Config panel management (prevents blocking)
- Connection creation helpers
- Memory cleanup on destroy
- Consistent initialization

This ensures that many bugs are prevented at the framework level.
