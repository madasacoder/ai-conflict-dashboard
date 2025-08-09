# Project Tasks and Status (authoritative)

Last updated: 2025-01-09

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
    - Status: DONE (2025-01-09)
    - File(s): `ui/src/types/workflow.ts`, `ui/src/services/workflowExecutor.ts`, `ui/src/utils/fileUpload.ts`, `ui/src/utils/testHelpers.ts`, `ui/src/state/workflowStore.ts`
    - TypeScript errors reduced from 892 to 787

11. Enable Playwright E2E (backend running, UI type-check green)
    - Status: PARTIAL (E2E tests now running, 2 passing, 54 failing due to missing UI features)

12. Document discovered bugs in `docs/BUGS.md` as we fix/confirm
    - Status: ONGOING

Summary: Phases = 3; Tasks = 12; Completed = 6; Partial = 2; In progress = 0; Blocked = 0; Remaining = 4.

## Current status (measured) - Updated 2025-01-09
- Backend server: UP at `http://localhost:8000`; Ollama available with 12 models
- Backend tests (server running, TESTING=1): 364 passed, 50 failed, 26 skipped, 23 errors
- Key backend fail clusters: circuit-breaker concurrency/state, provider adapter options, security assertions, some integration assumptions
- UI TypeScript: 787 errors (reduced from 892)
- UI/Playwright E2E: RUNNING — 2 passing, 54 failing (UI features not fully implemented)

## Progress Update (2025-01-09)
- **Major milestone achieved**: UI TypeScript errors reduced enough to unblock E2E testing
- Playwright E2E tests now executable with backend running
- Core type issues in workflow.ts, workflowExecutor.ts, and related modules resolved
- Next focus: Continue reducing TypeScript errors and implementing missing UI features for failing E2E tests

## Next actions (immediate)
1) Continue reducing remaining TypeScript errors (787 remaining)
2) Implement missing UI features to fix failing E2E tests
3) Fix provider adapter signatures and error handling (Task 7)
4) Address circuit breaker concurrency issues (Task 8)
5) Implement security hardening for API key sanitization (Task 9)

## Owner notes
- No tool/model limitations encountered; the gating issue is the scope of UI TS errors. Proceeding with targeted TS fixes to unblock E2E.


