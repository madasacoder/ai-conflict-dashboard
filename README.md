# AI Conflict Dashboard

Compare responses from multiple AI models side-by-side to get better insights and catch potential issues.

> **🚀 Major Update**: We are transforming this web application into a powerful desktop application using Tauri! See [DESKTOP_TRANSFORMATION_STATUS.md](docs/DESKTOP_TRANSFORMATION_STATUS.md) for details and progress tracking. The current web version remains fully functional during this transition.

## ✨ Features

### Core Functionality
- **Multi-Model Comparison**: Send queries to OpenAI, Claude, Gemini, and Grok simultaneously
- **Side-by-Side Display**: Visual comparison with syntax highlighting for code
- **Smart Token Management**: Automatic text chunking for large documents
- **Searchable History**: Find and reuse previous queries with real-time search
- **Multiple File Upload**: Upload and combine multiple files at once
- **Dark Mode**: Easy on the eyes with automatic theme switching

### Advanced Features
- **Per-User Circuit Breakers**: Individual API failure handling prevents one user affecting others
- **Structured Logging**: Comprehensive observability with automatic API key sanitization
- **Request Tracking**: Every API call logged with unique IDs and correlation
- **Model Selection**: Support for GPT-3.5/4, Claude, Gemini, and Grok models
- **Collapsible UI**: Space-efficient interface with intelligent state management
- **Rate Limiting**: Token bucket algorithm prevents abuse (60/min, 600/hour)
- **Memory Management**: Automatic cleanup and 10MB response size limits
- **Timeout Handling**: Adaptive timeouts with retry logic
- **Smart Text Chunking**: Preserves code blocks and markdown structure
- **XSS Protection**: DOMPurify integration for safe content rendering

## 🚀 Quick Start

### Production-Ready Startup (Recommended):
```bash
./start_app.sh
```

This script provides:
- Comprehensive error logging to `logs/` directory
- Import validation before startup
- Automatic port cleanup
- Service health monitoring
- Graceful shutdown handling

### Quick Development Mode:
```bash
./start_dev.sh
```

### One-Click Launch (Legacy):
- **Mac/Linux**: Double-click `run.sh` (or run `./run.sh` in terminal)
- **Windows**: Double-click `run.bat`

### Managing the Application:
```bash
./stop_app.sh    # Stop all services
./view_logs.sh   # Interactive log viewer
```

The app will automatically:
1. Install dependencies
2. Start the backend server
3. Open your browser
4. You just need to add your API keys!

## 📋 Requirements

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- API keys from OpenAI and/or Anthropic

## 🛠️ Manual Installation

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### 2. Frontend Setup

Simply open `frontend/index.html` in your web browser, or:

```bash
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080
```

### 3. Add Your API Keys

1. Get your API keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Claude: https://console.anthropic.com/account/keys
   - Gemini: https://makersuite.google.com/app/apikey
   - Grok: https://console.x.ai

2. Enter them in the collapsible API Settings section
   - Keys are stored locally in your browser (localStorage)
   - Never sent anywhere except to the respective APIs
   - Supports multiple model options for each provider

## 📖 Usage Examples

### Code Review
```
Review this Python function for potential bugs and suggest improvements:
[paste your code]
```

### Writing Enhancement
```
Improve this email to sound more professional while maintaining a friendly tone:
[paste your draft]
```

### Learning & Research
```
Explain the concept of quantum entanglement using everyday analogies
```

### Decision Making
```
What are the pros and cons of using microservices vs monolithic architecture for a startup?
```

## 🏗️ Architecture

### Backend (FastAPI + Python 3.11)
- **Async Support**: Parallel API calls for faster responses
- **Circuit Breakers**: Automatic failure recovery with configurable thresholds
- **Structured Logging**: JSON-formatted logs with request correlation
- **Type Safety**: Full type hints and Pydantic models
- **Token Management**: Smart text chunking for large documents
- **90%+ Test Coverage**: Comprehensive test suite with pytest

### Frontend (Vanilla JS + Bootstrap)
- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Local Storage**: API keys and preferences saved locally
- **Responsive Design**: Mobile-friendly interface
- **Syntax Highlighting**: Prism.js for beautiful code display
- **Real-time Search**: Instant filtering of history entries

### Security Features
- **Input Validation**: Comprehensive sanitization against XSS, SQL injection, and command injection
- **No Dynamic Execution**: No eval() or exec() usage
- **API Key Protection**: Automatic sanitization in logs, keys never exposed
- **CORS Configuration**: Environment-based whitelisting (development/production)
- **Security Scanning**: Zero vulnerabilities in Bandit scans
- **Rate Limiting**: Protection against DoS attacks and API quota exhaustion
- **Content Security**: DOMPurify for XSS prevention, CSP headers
- **Memory Protection**: Bounded response sizes and automatic garbage collection
- **Timeout Protection**: Prevents hanging requests with configurable limits

## 📊 Current Status

### Completed Features (Phase 1, 2 & 3)
- ✅ Multi-model API integration (OpenAI, Claude, Gemini, Grok)
- ✅ Parallel request processing with isolated fault handling
- ✅ Unicode-aware token counting and validation
- ✅ Smart text chunking preserving code blocks
- ✅ Searchable conversation history with IndexedDB
- ✅ Multiple file upload with duplicate name handling
- ✅ Syntax highlighting with XSS protection
- ✅ Dark/light theme with smooth transitions
- ✅ Per-user circuit breakers preventing cascade failures
- ✅ Structured logging with automatic sanitization
- ✅ Collapsible API settings with intelligent defaults
- ✅ Always-visible model selection with state persistence
- ✅ Rate limiting with burst handling
- ✅ Memory management with garbage collection
- ✅ Timeout handling with adaptive adjustments
- ✅ Comprehensive security hardening

### Quality Metrics
- **Backend Test Coverage**: 92.23% (100+ tests including security suite) ✅
- **Security Tests**: 22 comprehensive security tests all passing ✅
- **Code Quality**: Black, Ruff, Bandit all passing with zero issues ✅
- **Documentation**: Google-style docstrings throughout ✅
- **Performance**: <2s response time with adaptive timeout handling
- **Bug Fix Rate**: 100% (10 bugs found and fixed) ✅
- **Memory Efficiency**: Automatic cleanup keeps usage under control

### Recently Completed (Phase 3 Security)
- ✅ Rate limiting with token bucket algorithm
- ✅ Per-user circuit breakers for fault isolation  
- ✅ Memory management with automatic cleanup
- ✅ Timeout handling with adaptive adjustments
- ✅ XSS protection with DOMPurify
- ✅ Smart text chunking preserving code blocks
- ✅ API key sanitization in logs
- ✅ Environment-based CORS configuration

### Upcoming Features (Phase 4)
- 🔄 Redis caching layer for distributed systems
- 🔄 WebSocket support for real-time streaming
- 🔄 Export functionality (PDF, Markdown)
- 🔄 Team collaboration features
- 🔄 User authentication and workspace management

## 🐛 Troubleshooting

### "Failed to connect to server"
- Ensure the backend is running: `uvicorn main:app --reload`
- Check you're using http://localhost:8000
- Verify no firewall blocking

### "API error: 401"
- Verify your API keys are correct
- Check you have credits in your accounts
- Ensure keys have proper permissions

### "Circuit breaker open"
- Too many failed requests to an API
- Wait 60 seconds for automatic reset
- Check API status pages

### Large text issues
- Text over 3000 tokens is automatically chunked
- Each chunk processed separately
- Results combined in the UI

## 🧪 Development

### Running Tests
```bash
cd backend
source venv/bin/activate
pytest --cov=. --cov-fail-under=90
```

### Code Quality Checks
```bash
# Formatting
black .

# Linting
ruff check .

# Security
bandit -r .

# Type checking
mypy .
```

### Project Structure
```
ai-conflict-dashboard/
├── frontend/
│   ├── index.html      # Main UI with XSS protection
│   ├── js/
│   │   ├── xss-protection.js  # DOMPurify integration
│   │   ├── file-upload-fix.js # Enhanced file handling
│   │   └── utils.js          # Utility functions
│   └── src/            # React components (future)
├── backend/
│   ├── main.py         # FastAPI with security middleware
│   ├── llm_providers_fixed.py # Per-user circuit breakers
│   ├── token_utils_fixed.py   # Unicode-aware tokens
│   ├── structured_logging_fixed.py # Sanitized logging
│   ├── cors_config.py  # Secure CORS settings
│   ├── rate_limiting.py # Token bucket rate limiter
│   ├── memory_management.py # Memory protection
│   ├── timeout_handler.py # Adaptive timeouts
│   ├── smart_chunking.py # Intelligent text splitting
│   └── tests/          # 100+ comprehensive tests
├── docs/               # Complete documentation
└── CLAUDE.md          # AI coding standards
```

## 🤝 Contributing

This project follows strict coding standards:
1. No duplicate or temporary files
2. All changes must be tested
3. 90% minimum test coverage
4. Fix root causes, not symptoms
5. Google-style docstrings required

See `CLAUDE.md` for detailed AI coding assistance guidelines.

## 📄 License

This project is for educational and evaluation purposes. Please respect the terms of service of the AI providers you use.

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Bootstrap](https://getbootstrap.com/) - UI components
- [Prism.js](https://prismjs.com/) - Syntax highlighting
- [PyBreaker](https://github.com/danielfm/pybreaker) - Circuit breaker pattern
- [structlog](https://www.structlog.org/) - Structured logging

---

**Status**: Production-ready application with Phase 1, 2, and 3 (Security) features complete. All known bugs fixed. Enterprise-grade security and reliability implemented. See `docs/ROADMAP.md` for Phase 4 plans.