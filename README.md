# AI Conflict Dashboard

Compare responses from multiple AI models side-by-side to get better insights and catch potential issues.

## ✨ Features

### Core Functionality
- **Multi-Model Comparison**: Send queries to OpenAI and Claude simultaneously
- **Side-by-Side Display**: Visual comparison with syntax highlighting for code
- **Smart Token Management**: Automatic text chunking for large documents
- **Searchable History**: Find and reuse previous queries with real-time search
- **File Upload Support**: Drag-and-drop or click to upload text files
- **Dark Mode**: Easy on the eyes with automatic theme switching

### Advanced Features
- **Circuit Breakers**: Automatic API failure handling with PyBreaker
- **Structured Logging**: Comprehensive observability with structlog
- **Request Tracking**: Every API call is logged with unique request IDs
- **Model Selection**: Choose between different GPT and Claude models
- **Collapsible UI**: Space-efficient interface with collapsible API settings

## 🚀 Quick Start

### One-Click Launch:
- **Mac/Linux**: Double-click `run.sh` (or run `./run.sh` in terminal)
- **Windows**: Double-click `run.bat`

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
- **Input Validation**: All inputs sanitized and validated
- **No Dynamic Execution**: No eval() or exec() usage
- **API Key Protection**: Keys never logged or exposed
- **CORS Configuration**: Proper cross-origin handling
- **Security Scanning**: Regular Bandit scans

## 📊 Current Status

### Completed Features (Phase 1 & 2)
- ✅ Multi-model API integration (OpenAI, Claude)
- ✅ Parallel request processing
- ✅ Token counting and validation
- ✅ Text chunking for large documents
- ✅ Searchable conversation history
- ✅ File upload with drag-and-drop
- ✅ Syntax highlighting for code
- ✅ Dark/light theme support
- ✅ Circuit breakers for fault tolerance
- ✅ Structured logging system
- ✅ Collapsible API settings
- ✅ Model selection (GPT-3.5, GPT-4, Claude variants)

### Quality Metrics
- **Backend Test Coverage**: 90.10% ✅
- **Code Quality**: Black, Ruff, Bandit all passing ✅
- **Documentation**: Google-style docstrings throughout ✅
- **Performance**: <2s response time for most queries

### Upcoming Features (Phase 3)
- 🔄 Redis caching layer
- 🔄 API rate limiting
- 🔄 WebSocket support for streaming
- 🔄 Export functionality (PDF, Markdown)
- 🔄 Team collaboration features

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
│   ├── index.html      # Main UI
│   ├── prism.js        # Syntax highlighting
│   └── prism.css       # Syntax highlighting themes
├── backend/
│   ├── main.py         # FastAPI application
│   ├── llm_providers.py # API integrations
│   ├── token_utils.py  # Token management
│   ├── structured_logging.py # Logging setup
│   └── tests/          # Test suite
├── docs/               # Documentation
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

**Status**: Production-ready MVP with Phase 1 & 2 features complete. See `docs/ROADMAP.md` for future plans.