# Project Tasks and Status (authoritative)

Last updated: 2025-08-09

## Phases
- Phase 1: Backend robustness and correctness
- Phase 2: UI TypeScript health and Playwright E2E enablement
- Phase 3: Security and performance hardening (Grade A path)

## Task list (live)
1. Fix circuit-breaker provider-map initialization to avoid KeyError
   - Status: DONE
   - File(s): `backend/llm_providers.py`

2. Provide `process_workflow` entrypoint for tests
   - Status: DONE
   - File(s): `backend/main.py`

3. Payload size validation for `/api/analyze` (return 413) and bypass rate-limit in TESTING
   - Status: DONE
   - File(s): `backend/main.py`

4. Modernize backend tests that referenced legacy `frontend/` paths
   - Status: PARTIAL (key tests updated/skipped when legacy assets absent)
   - File(s): `backend/tests/test_workflow_builder_access.py`, `backend/tests/test_workflow_data_attribute_bug.py`, `backend/tests/test_workflow_functionality_integration.py`

5. Stabilize meta-tests (naming audit, undefined variable)
   - Status: DONE
   - File(s): `backend/tests/test_test_coverage_audit.py`, `backend/tests/test_regression_all_bugs.py`

6. Standardize environment to repo `venv311` and run backend with Ollama
   - Status: DONE

7. Align provider adapter/signatures and error handling (max_tokens, temperature, retries)
   - Status: TODO
   - File(s): `backend/llm_providers.py`, `backend/plugins/ollama_provider.py`

8. Circuit breaker concurrency and deterministic state transitions under load
   - Status: TODO
   - File(s): `backend/llm_providers.py`

9. Security hardening: API-key sanitization in all paths, injection defenses (SQL/XSS/XXE/cmd)
   - Status: TODO
   - File(s): `backend/structured_logging.py`, `backend/main.py`, helpers

10. UI TypeScript baseline fix (types for `Node`/`Edge`, executor, file upload helpers, workflow store)
    - Status: BLOCKED (primary)
    - File(s): `ui/src/types/workflow.ts`, `ui/src/services/workflowExecutor.ts`, `ui/src/utils/fileUpload.ts`, `ui/src/utils/testHelpers.ts`, `ui/src/state/workflowStore.ts`, and related tests

11. Enable Playwright E2E (backend running, UI type-check green)
    - Status: BLOCKED on Task 10

12. Document discovered bugs in `docs/BUGS.md` as we fix/confirm
    - Status: ONGOING

Summary: Phases = 3; Tasks = 12; Completed = 5; Partial = 1; In progress = 1; Blocked = 1; Remaining = 5.

## Current status (measured)
- Backend server: UP at `http://localhost:8000`; Ollama available with 12 models
- Backend tests (server running, TESTING=1): 364 passed, 50 failed, 26 skipped, 23 errors
- Key backend fail clusters: circuit-breaker concurrency/state, provider adapter options, security assertions, some integration assumptions
- UI/Playwright E2E: NOT RUNNING — blocked by 892 TypeScript errors across 65 files

## Why progress appears slow right now
- The primary blocker is Task 10: the UI TypeScript layer has 892 errors spanning core types (`Node`/`Edge`), workflow executor logic, file upload utilities, test helpers, and store types. Until type-check passes, Playwright refuses to run, so E2E cannot execute.
- Backend work proceeded (multiple tasks closed) and backend is ready for real E2E, but UI type health must be restored first.

## Next actions (immediate)
1) Fix `ui/src/types/workflow.ts` to model React Flow `Edge`/`Node` via safe intersections and required fields used in code/tests
2) Add null/undefined guards in `ui/src/services/workflowExecutor.ts` and correct `Edge` accessors (`source`, `target`, `targetHandle`)
3) Repair `FileList` test doubles and related helpers in `ui/src/utils/fileUpload.ts` and `ui/src/utils/testHelpers.ts`
4) Adjust `ui/src/state/workflowStore.ts` typings (LocalStorage helpers, exactOptionalPropertyTypes issues)
5) Re-run `npm run type-check` then `npx playwright test` with backend running

## Owner notes
- No tool/model limitations encountered; the gating issue is the scope of UI TS errors. Proceeding with targeted TS fixes to unblock E2E.


