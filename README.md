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
- **Visual Workflow Builder**: Drag-and-drop node-based interface for complex AI pipelines
- **Per-User Circuit Breakers**: Individual API failure handling prevents one user affecting others
- **Structured Logging**: Comprehensive observability with automatic API key sanitization
- **Request Tracking**: Every API call logged with unique IDs and correlation
- **Model Selection**: Support for GPT-3.5/4, Claude, Gemini, Grok, and local Ollama models
- **Collapsible UI**: Space-efficient interface with intelligent state management
- **Rate Limiting**: Token bucket algorithm prevents abuse (60/min, 600/hour)
- **Memory Management**: Automatic cleanup and 10MB response size limits
- **Timeout Handling**: Adaptive timeouts with retry logic
- **Smart Text Chunking**: Preserves code blocks and markdown structure
- **XSS Protection**: DOMPurify integration for safe content rendering
- **Workflow Execution Results**: Visual display of AI outputs with modal and node previews

## 🚀 Quick Start

> **⚠️ IMPORTANT**: For best compatibility, see [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md) to avoid browser HTTPS upgrade issues.

### Production-Ready Startup (Recommended):
```bash
./run_app.sh
```

**Automatically opens**: `http://127.0.0.1:3000` (avoids localhost HSTS issues)

This script provides:
- Browser compatibility (uses IP instead of localhost)
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

### Visual Workflow Builder
Create complex AI pipelines with the drag-and-drop interface:
1. Navigate to **Workflow Builder** from the main page
2. Drag nodes from the palette:
   - **Input Node**: Text, file, or URL input
   - **LLM Node**: Multi-model AI processing (supports Ollama for local models)
   - **Compare Node**: Find conflicts or consensus between responses
   - **Output Node**: Export results in various formats
3. Connect nodes by programmatic connection (drag-drop being improved)
4. Configure each node by clicking on it
5. Click **Run** to execute the workflow
6. View results in a modal with visual feedback on nodes

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

### Completed Features (Phase 1, 2, 3 & Workflow Builder)
- ✅ Multi-model API integration (OpenAI, Claude, Gemini, Grok, Ollama)
- ✅ Visual Workflow Builder with drag-and-drop node interface
- ✅ Workflow execution with visual output display (modal + node previews)
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

## 🧪 Development & Testing

### **Comprehensive Testing Stack** ⭐
We use cutting-edge testing tools that exceed industry standards:

| **Layer** | **Tool** | **Purpose** | **Status** |
|-----------|----------|-------------|------------|
| **Unit Testing** | Vitest | Fast, modern Jest alternative | ✅ **Implemented** |
| **Component Testing** | React Testing Library | Component behavior testing | ✅ **Implemented** |
| **E2E Testing** | Playwright | Cross-browser automation | ✅ **Implemented** |
| **API Mocking** | MSW 2.0 | Service worker mocking | ✅ **Implemented** |
| **DOM Environment** | happy-dom | 3x faster than jsdom | ✅ **Implemented** |

### **🛠️ Development Toolchain**

We maintain a comprehensive, production-grade toolchain across all components:

#### **Quick Commands**
```bash
# Run all quality checks
make quality

# Individual commands
make lint      # Run all linters
make format    # Run all formatters
make test      # Run all tests
make security  # Run security scans
```

#### **JavaScript/Frontend Toolchain**
| **Tool** | **Purpose** | **Configuration** |
|----------|-------------|------------------|
| **ESLint** | Linting + Security | `.eslintrc.security.cjs` with security plugins |
| **Prettier** | Code formatting | `.prettierrc` with consistent style |
| **npm audit** | Dependency scanning | Built into npm scripts |
| **Husky** | Pre-commit hooks | Automated quality checks |
| **Plato** | Code complexity | Visual complexity reports |

#### **Python/Backend Toolchain**
| **Tool** | **Purpose** | **Configuration** |
|----------|-------------|------------------|
| **Ruff** | Fast linting + formatting | `pyproject.toml` with security rules |
| **Black** | Code formatting | Line length 100, Python 3.11+ |
| **MyPy** | Static type checking | Strict mode enabled |
| **Bandit** | Security scanning | Comprehensive AST analysis |
| **pytest** | Testing framework | 90%+ coverage requirement |

#### **Rust/Desktop App Toolchain**
| **Tool** | **Purpose** | **Configuration** |
|----------|-------------|------------------|
| **rustfmt** | Code formatting | `rustfmt.toml` with project style |
| **clippy** | Linting | `clippy.toml` with strict rules |
| **cargo-audit** | Security scanning | Checks against RustSec database |

### **Running Tests**

#### **Frontend Tests** (Modern Stack)
```bash
cd frontend

# Install dependencies
npm install

# Unit tests with Vitest
npm test

# Interactive test UI
npm run test:ui

# Coverage report (85% target)
npm run test:coverage

# E2E tests with Playwright (5 browsers)
npm run test:e2e
```

#### **Backend Tests** (Production Ready)
```bash
cd backend
source venv/bin/activate

# Full test suite with coverage
pytest --cov=. --cov-fail-under=90

# Parallel execution for speed
pytest -n auto

# Security tests
pytest tests/test_security_comprehensive.py -v
```

### **Code Quality Checks**

#### **All-in-One Quality Check**
```bash
# Run comprehensive quality checks for all components
make quality
```

This runs:
- ✅ All linters (ESLint, Ruff, Clippy)
- ✅ All formatters (Prettier, Black, rustfmt)
- ✅ All tests with coverage requirements
- ✅ All security scans (npm audit, Bandit, cargo-audit)

#### **Pre-commit Hooks**
```bash
# Install pre-commit hooks (one-time setup)
make pre-commit

# Hooks run automatically on commit:
# - Trailing whitespace removal
# - File formatting (Python, JS, Rust)
# - Linting checks
# - Security scans
# - Secret detection
```

#### **Component-Specific Commands**

**Frontend (JavaScript)**
```bash
cd frontend
npm run lint      # ESLint with security plugins
npm run format    # Prettier formatting
npm run security  # npm audit + ESLint security
npm run quality   # Code complexity analysis
```

**Backend (Python)**
```bash
cd backend
./venv/bin/ruff check .     # Fast linting
./venv/bin/ruff format .    # Fast formatting
./venv/bin/black .          # Alternative formatter
./venv/bin/mypy .           # Type checking
./venv/bin/bandit -r .      # Security scanning
```

**Desktop App (Rust)**
```bash
cd desktop-app/src-tauri
cargo fmt          # Format code
cargo clippy       # Lint with suggestions
cargo audit        # Security vulnerability scan
cargo test         # Run tests
```

### **Testing Standards** ⚡

#### **✅ What We Test**
- **Security**: XSS prevention, input validation, API key protection
- **Performance**: Memory leaks, event listener cleanup, large workflows
- **Compatibility**: 5 browsers (Chrome, Firefox, Safari, Mobile)
- **Accessibility**: Keyboard navigation, ARIA labels, screen readers
- **Error Handling**: Network failures, invalid input, timeout scenarios
- **User Workflows**: Drag & drop, configuration, workflow execution

#### **✅ Quality Gates**
- **Frontend Coverage**: 85%+ (branches, functions, lines, statements)
- **Backend Coverage**: 92.23% achieved ✅
- **Zero Console.log**: Structured logging only per JAVASCRIPT-STANDARDS.md
- **XSS Protection**: All innerHTML uses DOMPurify.sanitize()
- **Memory Management**: Event listeners cleaned up on unmount

#### **🚀 Modern Testing Features**
```javascript
// ✅ Structured logging tests (NO console.log)
expect(global.logger.info).toHaveBeenCalledWith('user_action', {
  action: 'button_click',
  component: 'workflow_builder'
});

// ✅ XSS prevention tests
expect(global.DOMPurify.sanitize).toHaveBeenCalledWith(userInput);

// ✅ Cross-browser E2E tests
test('should work on mobile Safari', async ({ page }) => {
  // Runs on iPhone 12 simulator
});
```

### **📖 Testing Documentation**
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Comprehensive testing guide
- **[JAVASCRIPT-STANDARDS.md](JAVASCRIPT-STANDARDS.md)** - Testing standards & examples
- **[tests/](frontend/tests/)** - Example test implementations

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