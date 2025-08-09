# AI Conflict Dashboard

A comprehensive AI model comparison and analysis platform with testing and security measures in development.

## 🚧 Test Suite Status

This project includes a test suite that aims to prevent critical bugs from reoccurring. The implementation is currently in progress.

### Current Test Status (as of 2025-01-09)
- **Backend Tests (server running, TESTING=1)**: 364 passing, 50 failing, 26 skipped, 23 errors
- **Coverage**: ~51% overall (notable gaps e.g. `workflow_executor.py`)
- **Frontend (ui/)**: TypeScript errors reduced from 892 to 787; Playwright E2E now running (2 passing, 54 failing)
- **Grade**: Honest baseline B- quality; not production-ready

### Quick Start - Run Tests
```bash
# Run regression tests (Note: Some tests may fail due to known issues)
./run_grade_a_regression_tests.sh

# Backend tests have structural issues - use with caution
cd backend && pytest tests/ -v
```

### Critical Bugs Being Addressed (Partial Coverage)
- **BUG-081**: Desktop App Missing React Flow Instance (test exists, execution issues)
- **BUG-082**: Drag and Drop Completely Broken (test exists, needs verification)
- **BUG-075**: Circuit Breaker Doesn't Open After Failures (has race conditions)
- **BUG-086**: API Key Exposed in Error Messages (partially tested)
- **BUG-108**: Data Leakage Between Concurrent Requests (needs more testing)
- **BUG-102**: Race Condition in Circuit Breaker (known issue)
- **BUG-103**: Consensus Analysis Shows False Agreement (needs implementation)
- **BUG-105**: Missing Input Size Validation (incomplete)
- **BUG-109**: Rate Limiting Can Be Bypassed (testing in progress)
- **BUG-110**: Memory Leak Under Parallel Load (not fully resolved)

### Known Issues
- Backend: failing/erroring tests remain (circuit breaker concurrency, provider adapters, security assertions)
- 23 test collection/execution errors persist in critical regression suite
- Gemini/Grok providers are mock-only
- UI: Core TypeScript issues resolved; E2E tests running but most failing due to missing UI features

For documentation (note: being updated for accuracy), see [GRADE_A_REGRESSION_TEST_DOCUMENTATION.md](GRADE_A_REGRESSION_TEST_DOCUMENTATION.md)

## Features

### Core Functionality
- **Multi-Model Analysis**: Compare responses from OpenAI, Claude, Gemini, Grok, and Ollama
- **Workflow Builder**: Visual drag-and-drop interface for creating analysis workflows
- **Real-time Execution**: Live monitoring of workflow execution
- **Result Comparison**: Side-by-side comparison of model outputs
- **Consensus Analysis**: Identify agreement and conflicts between models

### Security & Reliability
- **Circuit Breakers**: Per-API-key circuit breakers prevent cascading failures
- **Rate Limiting**: Comprehensive rate limiting with multiple time windows
- **API Key Sanitization**: Automatic sanitization of sensitive data in logs and responses
- **Request Isolation**: Complete isolation between concurrent requests
- **Memory Management**: Automatic memory monitoring and cleanup

### Testing & Quality (In Development)
- **Regression Tests**: Test suite in development (currently 74.8% pass rate)
- **E2E Tests**: Some end-to-end testing implemented
- **Security Testing**: Basic security tests (needs expansion)
- **Performance Testing**: Memory leak detection (partially working)
- **Goal**: Working towards comprehensive test coverage

## Architecture

### Frontend (React + TypeScript)
- **React Flow**: Visual workflow builder
- **Zustand**: State management
- **Vitest**: Unit and integration testing
- **Playwright**: E2E testing

### Backend (Python + FastAPI)
- **FastAPI**: High-performance API framework
- **Pytest**: Comprehensive testing framework
- **Circuit Breakers**: Fault tolerance implementation
- **Rate Limiting**: Token bucket algorithm
- **Memory Management**: Automatic resource cleanup

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Ollama (optional, for local models)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-conflict-dashboard
```

2. **Install frontend dependencies**
```bash
cd ui
npm install
```

3. **Install backend dependencies**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Start the backend server**
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

5. **Start the frontend development server**
```bash
cd ui
npm run dev
```

6. **Run tests (optional - known issues exist)**
```bash
# Run tests - expect some failures
./run_grade_a_regression_tests.sh
```

## Testing

### Test Suites (Known Issues Exist)
```bash
# Backend - full suite (expect failures/errors)
cd backend && source venv/bin/activate && python -m pytest -q

# Backend coverage snapshot
python -m pytest --cov=. --cov-report=term-missing -q

# UI - type check, unit tests, E2E
cd ../ui && npm ci --no-audit --no-fund
npm run type-check
npm test -- --run
npx playwright install
npx playwright test --reporter=line
```

### Regular Test Suites
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd ui
npm test

# E2E tests
cd ui
npm run test:e2e
```

## Security Features

### API Key Protection
- Automatic sanitization in all logs and responses
- No API keys exposed in error messages
- Secure storage and transmission

### Rate Limiting
- Token bucket algorithm with multiple time windows
- Per-API-key rate limiting
- Configurable limits for different endpoints

### Circuit Breakers
- Per-API-key circuit breakers
- Automatic failure detection and recovery
- Prevents cascading failures

### Request Isolation
- Complete isolation between concurrent requests
- No data leakage between users
- Memory isolation and cleanup

## Performance Features

### Memory Management
- Automatic memory monitoring
- Periodic cleanup of large objects
- Request context tracking
- Memory usage endpoints for monitoring

### Smart Chunking
- Preserves code blocks during text chunking
- Respects markdown structure
- Maintains paragraph boundaries

### Token Counting
- Unicode-aware token estimation
- Proper handling of emojis and CJK characters
- Accurate billing calculations

## Development

### Code Quality
- **Black**: Python code formatting
- **Ruff**: Python linting
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Real user scenario testing
- **GRADE A Regression Tests**: Critical bug prevention
- **Security Tests**: Vulnerability detection
- **Performance Tests**: Memory and speed monitoring

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD approach)
4. Implement the feature
5. Run all test suites
6. Submit a pull request

## Documentation

- [GRADE A Regression Test Documentation](GRADE_A_REGRESSION_TEST_DOCUMENTATION.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Development Setup](docs/DEVELOPMENT_SETUP.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Bug Database](docs/BUGS.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the [documentation](docs/)
- Review the [bug database](docs/BUGS.md)
- Run the [GRADE A regression tests](GRADE_A_REGRESSION_TEST_DOCUMENTATION.md)

---

**Goal**: Improve test coverage and reliability to prevent bugs from reaching production.
**Current Status**: Test suite in active development with known issues being addressed.
