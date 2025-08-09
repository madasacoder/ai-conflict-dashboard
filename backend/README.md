# AI Conflict Dashboard - Backend

A FastAPI backend for the AI Conflict Dashboard with testing in development.

## 🚧 Test Suite Status

The backend test suite is currently under development with known structural issues.

### Current Issues (latest local run)
- **Test Results**: 319 passing, 108 failing, 13 skipped, 23 errors
- **Coverage**: ~51% overall (notable gaps in `workflow_executor.py`, `timeout_handler.py`)
- **Known Problems**: Missing mocks/live-server assumptions, race conditions in circuit breaker, Gemini/Grok providers are mock-only

### Running Tests (With Known Issues)
```bash
# Regular test suite (expect failures/errors)
python -m pytest -q

# Coverage snapshot
python -m pytest --cov=. --cov-report=term-missing -q
```

### Backend Bugs Being Addressed (Partial Coverage)
- **BUG-075**: Circuit Breaker Doesn't Open After Failures 🚧 (race conditions exist)
- **BUG-086**: API Key Exposed in Error Messages 🚧 (partial sanitization)
- **BUG-108**: Data Leakage Between Concurrent Requests 🚧 (needs verification)
- **BUG-102**: Race Condition in Circuit Breaker 🚧 (known issue)
- **BUG-103**: Consensus Analysis Shows False Agreement 🚧 (incomplete)
- **BUG-105**: Missing Input Size Validation 🚧 (partial)
- **BUG-109**: Rate Limiting Can Be Bypassed 🚧 (testing needed)
- **BUG-110**: Memory Leak Under Parallel Load 🚧 (not resolved)

## Features

### Core Functionality
- **Multi-Model API Integration**: OpenAI, Claude, Gemini, Grok, and Ollama
- **Workflow Execution Engine**: Topological execution of complex workflows
- **Real-time Processing**: Async processing with progress tracking
- **Result Aggregation**: Intelligent comparison and consensus analysis
- **Smart Token Management**: Unicode-aware token counting and chunking

### Security & Reliability
- **Circuit Breakers**: Per-API-key circuit breakers prevent cascading failures
- **Rate Limiting**: Token bucket algorithm with multiple time windows
- **API Key Sanitization**: Automatic sanitization of sensitive data
- **Request Isolation**: Complete isolation between concurrent requests
- **Memory Management**: Automatic monitoring and cleanup

### Testing & Quality (In Development)
- **Regression Tests**: Test suite in progress (74.8% passing)
- **Unit Tests**: Basic function-level testing with pytest
- **Integration Tests**: Some API endpoint testing
- **Security Tests**: Basic vulnerability detection (needs expansion)
- **Performance Tests**: Memory leak detection (partially working)
- **Goal**: Working towards comprehensive coverage

## Technology Stack

- **FastAPI**: High-performance API framework
- **Python 3.11+**: Modern Python with type hints
- **Pytest**: Comprehensive testing framework
- **Pydantic**: Data validation and serialization
- **SQLAlchemy**: Database ORM (if needed)
- **Redis**: Caching and session storage (optional)
- **Docker**: Containerization support

## Quick Start

### Prerequisites
- Python 3.11+
- pip or poetry

### Installation
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
python -m pytest
```

## Testing

### GRADE A Critical Bug Regression Tests
```bash
# Expect collection/runtime errors until fixtures and assumptions are fixed
python -m pytest tests/test_critical_bug_regression.py -v
```

### Regular Test Suites
```bash
# Run all tests
python -m pytest

# Run tests with coverage
python -m pytest --cov=. --cov-report=html

# Run specific test files
python -m pytest tests/test_api.py
python -m pytest tests/test_llm_providers.py

# Run tests in parallel
python -m pytest -n auto
```

### Test Categories

#### 1. Unit Tests
- Function behavior testing
- Class method testing
- Utility function testing
- Data validation testing

#### 2. Integration Tests
- API endpoint testing
- Database integration testing
- External service integration testing
- Workflow execution testing

#### 3. Security Tests
- Input validation testing
- Authentication testing
- Authorization testing
- Vulnerability detection testing

#### 4. Performance Tests
- Memory usage testing
- Response time testing
- Load testing
- Resource cleanup testing

#### 5. GRADE A Regression Tests
- Critical bug prevention testing
- Edge case testing
- Race condition testing
- Memory leak detection

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── llm_providers.py           # AI model provider implementations
├── rate_limiting.py           # Rate limiting implementation
├── structured_logging.py      # Logging with sanitization
├── memory_management.py       # Memory monitoring and cleanup
├── smart_chunking.py          # Intelligent text chunking
├── timeout_handler.py         # Timeout and retry logic
├── cors_config.py             # CORS configuration
├── requirements.txt           # Python dependencies
├── pyproject.toml            # Project configuration
└── tests/                    # Test files
    ├── test_critical_bug_regression.py  # GRADE A tests
    ├── test_api.py           # API endpoint tests
    ├── test_llm_providers.py # Provider tests
    ├── test_security.py      # Security tests
    └── conftest.py           # Test configuration
```

## Development

### Code Quality
- **Black**: Python code formatting
- **Ruff**: Python linting and import sorting
- **MyPy**: Type checking
- **Bandit**: Security linting
- **Pre-commit**: Git hooks for quality checks

### Testing Strategy
- **TDD Approach**: Write tests first
- **Comprehensive Coverage**: 100% critical path coverage
- **Edge Case Testing**: All boundary conditions tested
- **Security Testing**: All inputs validated
- **Performance Testing**: Memory and speed monitored

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD approach)
4. Implement the feature
5. Run all test suites
6. Submit a pull request

## Critical Bug Prevention

### BUG-075: Circuit Breaker
- **Tests**: Circuit breaker opening after failures
- **Coverage**: Per-API-key isolation, recovery mechanisms
- **Prevention**: Comprehensive failure scenario testing

### BUG-086: API Key Exposure
- **Tests**: API key sanitization in all outputs
- **Coverage**: Error messages, logs, headers, cookies
- **Prevention**: Automatic sanitization and validation

### BUG-108: Data Leakage
- **Tests**: Request isolation and memory isolation
- **Coverage**: Concurrent requests, session isolation
- **Prevention**: Complete request context isolation

## Performance Monitoring

### Memory Management
- Automatic memory usage monitoring
- Memory leak detection in tests
- Resource cleanup verification
- Large object tracking

### Performance Testing
- Response time monitoring
- API endpoint performance
- Workflow execution speed
- Concurrent request handling

## Security Features

### API Key Protection
- Automatic sanitization in all logs and responses
- No API keys exposed in error messages
- Secure storage and transmission
- Input validation and sanitization

### Rate Limiting
- Token bucket algorithm with multiple time windows
- Per-API-key rate limiting
- Configurable limits for different endpoints
- Bypass attempt detection

### Circuit Breakers
- Per-API-key circuit breakers
- Automatic failure detection and recovery
- Prevents cascading failures
- Configurable thresholds and timeouts

### Request Isolation
- Complete isolation between concurrent requests
- No data leakage between users
- Memory isolation and cleanup
- Session context isolation

## API Endpoints

### Core Endpoints
- `POST /api/analyze`: Multi-model analysis
- `POST /api/workflows/execute`: Workflow execution
- `GET /api/health`: Health check
- `GET /api/models`: Available models

### Management Endpoints
- `GET /api/memory`: Memory usage statistics
- `GET /api/rate-limits`: Rate limiting status
- `POST /api/circuit-breakers/reset`: Reset circuit breakers

## Configuration

### Environment Variables
```bash
# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
XAI_API_KEY=your_xai_key

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=600
RATE_LIMIT_PER_DAY=10000

# Circuit Breakers
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60

# Memory Management
MAX_RESPONSE_SIZE=10485760  # 10MB
MEMORY_CLEANUP_INTERVAL=300  # 5 minutes
```

## Documentation

- [GRADE A Regression Test Documentation](../GRADE_A_REGRESSION_TEST_DOCUMENTATION.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Bug Database](../docs/BUGS.md)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Goal**: Improve test coverage and fix structural issues in the test suite.
**Current Status**: 74.8% tests passing, working to resolve collection errors and missing implementations.