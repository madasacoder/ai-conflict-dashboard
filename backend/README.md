# AI Conflict Dashboard - Backend API

Production-ready FastAPI backend with enterprise-grade security, reliability, and comprehensive AI model support.

## 🚀 Quick Start

```bash
# Using virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API will be available at: http://127.0.0.1:8000

## 📋 Features

### Core Capabilities
- **Multi-Model Support**: OpenAI, Claude, Gemini, Grok, and Ollama
- **Parallel Processing**: Async API calls with isolated fault handling
- **Smart Text Chunking**: Preserves code blocks and markdown structure
- **Circuit Breakers**: Per-user fault isolation prevents cascade failures
- **Rate Limiting**: Token bucket algorithm (60/min, 600/hour)
- **Memory Management**: Automatic cleanup and bounded response sizes
- **Timeout Handling**: Adaptive timeouts with retry logic
- **Structured Logging**: JSON-formatted logs with request correlation

### Security Features
- ✅ Input validation against XSS, SQL injection, command injection
- ✅ API key sanitization in logs
- ✅ CORS configuration with environment-based whitelisting
- ✅ No dynamic code execution (no eval/exec)
- ✅ Comprehensive security test suite
- ✅ Zero vulnerabilities in Bandit scans

## 🛠️ Development Toolchain

### Quick Quality Checks
```bash
# Run all quality checks
make backend-lint    # Linting only
make backend-format  # Formatting only
make backend-test    # Tests only
make backend-security # Security scan only

# Or run everything
cd .. && make quality
```

### Tools Configuration

#### **Ruff** (Fast Python Linter)
- Configuration: `pyproject.toml`
- Combines functionality of Flake8, isort, pyupgrade
- Security rules enabled (S-prefix rules)
```bash
ruff check .        # Lint
ruff format .       # Format
```

#### **Black** (Code Formatter)
- Configuration: `pyproject.toml`
- Line length: 100
- Target: Python 3.11+
```bash
black .             # Format all files
black --check .     # Check without modifying
```

#### **MyPy** (Type Checker)
- Configuration: `pyproject.toml`
- Strict mode enabled
- Type stubs for major dependencies
```bash
mypy .              # Type check all files
```

#### **Bandit** (Security Scanner)
- Configuration: `pyproject.toml`
- Scans for common security issues
- Excludes test files
```bash
bandit -r . -f json -o bandit_report.json
bandit -r . -f screen --skip B101
```

#### **pytest** (Testing Framework)
- Configuration: `pytest.ini` and `pyproject.toml`
- Coverage requirement: 90%+
- Async support enabled
```bash
pytest                      # Run all tests
pytest -n auto             # Parallel execution
pytest --cov=. --cov-report=html  # With coverage
```

## 📊 Quality Metrics

### Current Status
- **Test Coverage**: 92.23% ✅
- **Security Issues**: 0 ✅
- **Type Coverage**: 100% ✅
- **Code Quality**: A+ ✅

### Testing Strategy
```bash
# Unit tests
pytest tests/test_*.py

# Security tests
pytest tests/test_security_comprehensive.py -v

# Integration tests
pytest tests/test_api_analyze.py -v

# Performance tests
pytest tests/test_extreme_parallel.py -v
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── main.py                    # FastAPI application
├── llm_providers.py           # AI model integrations
├── token_utils.py             # Text chunking utilities
├── structured_logging.py      # Logging configuration
├── cors_config.py            # CORS security settings
├── rate_limiting.py          # Rate limiter implementation
├── memory_management.py      # Memory protection
├── timeout_handler.py        # Adaptive timeout handling
├── smart_chunking.py         # Intelligent text splitting
├── plugins/
│   └── ollama_provider.py    # Ollama integration
├── tests/                    # Comprehensive test suite
├── pyproject.toml           # Tool configurations
├── requirements.txt         # Dependencies
└── pytest.ini              # Test configuration
```

### Key Components

#### API Endpoints
- `POST /analyze` - Main analysis endpoint
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

#### Request Flow
1. Request validation (Pydantic)
2. Rate limit check (token bucket)
3. Circuit breaker check (per-user)
4. Parallel API calls (asyncio)
5. Response aggregation
6. Structured logging

## 🔧 Configuration

### Environment Variables
```bash
# Create .env file
ENVIRONMENT=development  # or production
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60
```

### CORS Settings
- Development: `localhost`, `127.0.0.1`
- Production: Configure explicit origins

## 📖 API Documentation

### Interactive Docs
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Example Request
```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "api_keys": {
      "openai": "sk-...",
      "anthropic": "sk-ant-..."
    },
    "selected_models": {
      "openai": "gpt-4",
      "anthropic": "claude-3-opus-20240229"
    }
  }'
```

## 🐛 Troubleshooting

### Common Issues

#### "Module not found"
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

#### "Port already in use"
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
# Or use a different port
uvicorn main:app --port 8001
```

#### "Circuit breaker open"
- Per-user circuit breaker triggered
- Wait 60 seconds for automatic reset
- Check logs for root cause

## 🚦 Testing

### Run Tests
```bash
# All tests with coverage
pytest --cov=. --cov-report=html

# Specific test file
pytest tests/test_api_analyze.py -v

# With detailed output
pytest -xvs

# Parallel execution (faster)
pytest -n auto
```

### Coverage Report
```bash
# Generate HTML report
pytest --cov=. --cov-report=html
# Open htmlcov/index.html in browser

# Terminal report
pytest --cov=. --cov-report=term-missing
```

## 🤝 Contributing

1. **Code Style**: Run `black` and `ruff` before committing
2. **Type Hints**: All functions must have type annotations
3. **Tests**: Maintain 90%+ coverage
4. **Documentation**: Update docstrings and README
5. **Security**: Run `bandit` before submitting PR

### Pre-commit Setup
```bash
# Install pre-commit hooks
cd .. && make pre-commit

# Hooks run automatically on commit
git commit -m "feat: add new feature"
```

## 📄 License

See main project README for license information.