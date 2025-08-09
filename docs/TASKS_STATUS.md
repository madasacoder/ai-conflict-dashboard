# Project Tasks and Status (authoritative)

Last updated: 2025-08-09

## Phases
- Phase 1: Backend robustness and correctness
- Phase 2: UI TypeScript health and Playwright E2E enablement
- Phase 3: Security and performance hardening (Grade A path)

## Current Snapshot
- Backend server: healthy; Ollama available (12 models)
- Backend tests (server running, TESTING=1): 364 passed, 50 failed, 26 skipped, 23 errors
- UI Playwright: 2 passed, 86 failed (primary blocker: missing launch button selector)
- UI TypeScript errors: 298 (down from 326)

## Completed
1. Circuit-breaker provider-map initialization fixed (lazy, normalized keys)
2. /api/analyze payload-size validation (413) and TESTING-mode rate-limit bypass
3. Introduced `process_workflow` entrypoint for tests
4. Modernized legacy frontend path tests (use `ui/` or skip)
5. Stabilized meta tests and standardized repo `venv311`
6. workflowExecutor.ts fully typed and hardened (cycle/order guards, fetch signals, consistent results)
7. ExecutionPanel safe progress/date handling and status fallbacks

## In Progress
- Reduce UI TypeScript errors (tests/components)
- Align Playwright tests with actual UI (deterministic launch selector)

## Next Actions
- Add deterministic `data-testid="launch-workflow-builder"` in home page; update tests to use it
- Create React Flow test node factory and update tests to use typed nodes
- Centralize Playwright option helpers to satisfy exactOptionalPropertyTypes
- Remove/underscore unused variables in tests; add DOM casts where required