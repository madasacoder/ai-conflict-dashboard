# Testing Documentation - AI Conflict Dashboard

## Overview

The AI Conflict Dashboard has a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests across both backend and frontend components.

## Test Statistics

### Backend Tests (Python/FastAPI)
- **Status (latest local run, server running, TESTING=1)**: 364 passed, 50 failed, 26 skipped, 23 errors
- **Coverage**: ~51% overall
- **Types**:
  - Unit Tests: ~60 tests
  - Integration Tests: 25 tests
  - API Integration Tests: 12 tests

### Frontend Tests (TypeScript/React)
- **Unit/Integration (Vitest)**: currently blocked by TypeScript errors across many files
- **E2E (Playwright)**: runs in real browser; latest run → 10 passed, 46 failed
- **Coverage Target**: 85%

## Backend Testing

### Running Backend Tests

```bash
cd backend
source ../venv311/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_integration.py

# Run with verbose output
pytest -v

# Run only integration tests
pytest tests/test_integration.py tests/test_api_integration.py
```

### Test Structure

#### Unit Tests
Located in `backend/tests/`:
- `test_llm_providers.py` (29 tests) - Tests for each AI provider
- `test_token_utils.py` (15 tests) - Token counting and chunking
- `test_structured_logging.py` (9 tests) - Logging functionality
- `test_main.py` (4 tests) - Main app endpoints
- `test_api_analyze.py` (12 tests) - API endpoint testing

#### Integration Tests
- `test_integration.py` (13 tests)
  - Full workflow integration
  - Circuit breaker integration
  - Logging integration
  - Health check integration

- `test_api_integration.py` (12 tests)
  - Multi-file content analysis
  - Unicode handling
  - Concurrent requests
  - Error scenarios
  - CORS testing

### Key Testing Features

1. **Mocking Strategy**
   - All external API calls are mocked
   - Circuit breakers are tested with controlled failures
   - Async functions properly tested with `pytest-asyncio`

2. **Error Scenarios**
   - Network failures
   - API rate limits
   - Invalid API keys
   - Timeout handling
   - Malformed requests

3. **Performance Testing**
   - Concurrent request handling
   - Large payload processing
   - Timeout verification

## Frontend Testing

### Setting Up Frontend Tests (UI)

```bash
cd ui
npm ci --no-audit --no-fund

# Type check (currently failing)
npm run type-check

# E2E in real browser
npx playwright install --with-deps
npx playwright test --reporter=line
```

### Test Structure

#### Unit/Integration (Vitest)
- Located in `ui/src/**/__tests__/` (blocked until TS errors are resolved)

#### E2E Tests (Playwright)
- Located in `ui/playwright-tests/`

### Frontend Test Configuration

#### Vitest Configuration (`vitest.config.js`)
```javascript
{
  environment: 'happy-dom',
  globals: true,
  coverage: {
    thresholds: {
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85
    }
  }
}
```

#### Playwright Configuration (`ui/playwright.config.ts`)
- Base URL: `http://localhost:3001`
- Web server: `npm run dev` on port 3001 (reuses existing server)
- Project: Chromium desktop
- Trace: on first retry; Reporter: html

## Test Data and Fixtures

### Backend Test Fixtures
- Mock API responses for all providers
- Error response templates
- Large text samples for chunking tests
- Unicode test strings

### Frontend Test Fixtures
- Prefer E2E for drag-and-drop/React Flow interactions
- Use MSW for network mocks in unit/integration (after TS is green)

## Continuous Integration

### GitHub Actions Workflow (Recommended)
```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=. --cov-fail-under=90

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          cd frontend
          npm install
          npm test
          npx playwright install
          npm run test:e2e
```

## Test Best Practices

### Backend
1. Always use async test functions for async code
2. Mock external dependencies at the boundary
3. Test error paths as thoroughly as success paths
4. Use fixtures for common test setup
5. Keep tests independent and idempotent

### Frontend
1. Test user interactions, not implementation details
2. Use data-testid attributes for reliable element selection
3. Mock API calls in unit tests
4. Use real browser testing for critical flows
5. Test accessibility alongside functionality

## Debugging Tests

### Backend Debugging
```bash
# Run with debugging output
pytest -vv -s

# Run specific test
pytest tests/test_integration.py::TestFullWorkflowIntegration::test_full_analysis_workflow_all_providers

# Run with pdb on failure
pytest --pdb
```

### Frontend Debugging
```bash
# Debug Playwright tests
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Inspect a single spec
npx playwright test playwright-tests/workflow.spec.ts --headed --debug
```

## Test Coverage Goals

### Current Coverage
- Backend: ~51%
- Frontend: TBD (target 85%)

### Coverage Reports
- Backend: `backend/htmlcov/index.html`
- Frontend: `frontend/coverage/index.html`

## Common Test Scenarios

### 1. Testing New Provider Integration
- Add provider mock in test fixtures
- Test success case
- Test error handling
- Test timeout behavior
- Test circuit breaker integration

### 2. Testing UI Component
- Test initial render
- Test user interactions
- Test error states
- Test loading states
- Test data persistence

### 3. Testing API Endpoint
- Test valid requests
- Test validation errors
- Test authentication/authorization
- Test rate limiting
- Test CORS headers

## Known E2E Issues (latest run)
1. `.workflow-canvas` ends up with 0 height → drag timeouts (invisible target)
2. Duplicate `.workflow-builder` selectors (outer and inner) → strict selector conflicts
3. Execute button disabled when tests expect validation click
4. Label mismatches (tests expect “Workflow”/“Create New”; UI uses icon dropdown/“New Workflow”)

## Future Testing Improvements
1. Performance testing (Locust), response time benchmarks, memory profiling
2. Security testing (OWASP ZAP), dependency scanning, input fuzzing
3. Visual regression (Percy/Chromatic) and cross-browser coverage
4. Contract testing (OpenAPI validation, UI/backend contract tests)