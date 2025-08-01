# Implementation Notes - AI Conflict Dashboard

## Current State (August 1, 2025)

### Overview
The AI Conflict Dashboard is a production-ready web application that allows users to compare responses from multiple AI models (OpenAI, Claude, Gemini, and Grok) side-by-side. The application features a robust backend with circuit breakers, structured logging, and comprehensive testing, paired with a responsive frontend that works across all modern browsers.

### Architecture

#### Backend (FastAPI + Python 3.11)
- **Location**: `/backend/`
- **Main Components**:
  - `main.py`: FastAPI application with CORS, health check, and analyze endpoint
  - `llm_providers.py`: Unified interface for all AI providers with circuit breakers
  - `token_utils.py`: Token counting and text chunking utilities
  - `structured_logging.py`: Centralized logging with correlation IDs
  - `tests/`: Comprehensive test suite with 92.23% coverage

#### Frontend (Vanilla JavaScript + Bootstrap)
- **Location**: `/frontend/`
- **Main Components**:
  - `index.html`: Single-page application with all UI components
  - `comparison-engine.js`: Advanced text comparison logic
  - `history-manager.js`: IndexedDB-based history management
  - Bootstrap 5.3 for styling
  - Prism.js for syntax highlighting

### Key Features Implemented

#### 1. Multi-Provider Support
- **OpenAI**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- **Claude**: Haiku, Sonnet, Opus, Claude 2.1
- **Gemini**: 1.5 Flash, 1.5 Flash-8B, 1.5 Pro, 1.0 Pro
- **Grok**: Grok 2, Grok 2 Mini, Grok Beta

#### 2. Fault Tolerance
- PyBreaker circuit breakers on all API calls
- Automatic failure recovery after 60 seconds
- Graceful error handling and user feedback
- Structured logging for debugging

#### 3. User Experience
- Multiple file upload with drag-and-drop
- Always-visible model selection interface
- Collapsible API settings to save space
- Dark/light theme support
- Searchable history with IndexedDB
- Real-time character and token counting
- Keyboard shortcuts for power users

#### 4. Security
- Input validation on all endpoints
- API keys stored in browser localStorage only
- No server-side key storage or logging
- CORS properly configured
- No dynamic code execution

### Recent Changes (August 1, 2025)

1. **Multiple File Upload**
   - Added `multiple` attribute to file input
   - Enhanced drag-and-drop to accept multiple files
   - Files combined with clear separators
   - Visual badges for uploaded files

2. **Model Selection UI**
   - Created always-visible Model Selection section
   - Added visual cards for each provider
   - Synchronized dropdowns between settings and display
   - Clear indication of which models are available

3. **Provider Integrations**
   - Added Google Gemini support via google-generativeai
   - Added xAI Grok support via OpenAI-compatible API
   - Extended circuit breakers to new providers
   - Comprehensive test coverage for all providers

### Testing & Quality

#### Test Coverage (92.23%)
- `test_llm_providers.py`: 72 tests for all providers
- `test_main.py`: API endpoint tests
- `test_structured_logging.py`: Logging system tests
- `test_token_utils.py`: Token counting and chunking tests

#### Code Quality
- Black formatting applied
- Ruff linting passing
- Bandit security scan clean
- Google-style docstrings throughout
- Type hints on all functions

### Configuration

#### Environment Variables
- `LOG_LEVEL`: Set to DEBUG for detailed logging
- `CLAUDE_MAX_TOKENS`: Override default 4096
- `OPENAI_MAX_TOKENS`: Override default 4096

#### Frontend Settings (localStorage)
- API keys for each provider
- Selected models for each provider
- Theme preference (light/dark)
- API settings expansion state
- Response history (IndexedDB)

### Known Limitations

1. **Token Limits**
   - Text over 3000 tokens is automatically chunked
   - Each chunk processed separately
   - UI shows only first chunk results

2. **Rate Limiting**
   - No built-in rate limiting (planned for Phase 3)
   - Relies on circuit breakers for protection

3. **Caching**
   - No response caching yet (planned for Phase 3)
   - Each request hits the APIs directly

### Development Workflow

1. **Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Running**
   ```bash
   # Backend
   uvicorn main:app --reload
   
   # Frontend
   # Just open index.html in browser
   ```

3. **Testing**
   ```bash
   pytest --cov=. --cov-report=term-missing
   ```

4. **Code Quality**
   ```bash
   black .
   ruff check . --fix
   bandit -r .
   ```

### Next Steps (Phase 3)
- Redis caching layer for responses
- API rate limiting with slowapi
- WebSocket support for streaming
- Export functionality (PDF, Markdown)
- Team collaboration features

### Maintenance Notes

- Circuit breakers reset after 60 seconds
- Logs rotate automatically via structlog
- Frontend works without JavaScript (degraded)
- All errors logged with correlation IDs
- History stored in IndexedDB (50MB limit)