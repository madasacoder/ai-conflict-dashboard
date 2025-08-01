# 📗 Claude Project Instructions - AI Conflict Dashboard

This document defines explicit rules and instructions for AI coding assistants (Claude, Cursor) when contributing to the AI Conflict Dashboard.

---

## 🚀 Project Philosophy
The AI Conflict Dashboard transparently orchestrates multiple AI models, providing clear insights, consensus, and explicit conflict resolution, enabling informed editing decisions.

**Current Status**: Production-ready with Phase 1 & 2 complete. 90%+ test coverage, enterprise-grade reliability.

---

## ⚠️ Critical Rules (Must Follow)

### 1. No Duplicate or Temporary Files
- ❌ No file names with `_backup`, `_old`, numbered versions (`component_v2.tsx`, `api_fixed.py`)
- ✅ Modify existing files directly and use git for version control.

### 2. Temporary Files Handling
- Temporary files must be stored in `temporary_files/`.

### 3. Planning & Approval Required
1. Analyze clearly impacted files.
2. Plan your changes explicitly.
3. Confirm with project lead approval.
4. Implement only after explicit approval.

### 4. Strict Testing Policies
- Fix root causes, not tests.
- Add regression tests for bug fixes.
- Never skip or weaken tests.
- Maintain 90%+ coverage for backend, 85%+ for frontend.

---

## 💻 Technical Guidelines

### Frontend (Vanilla JS + Bootstrap)
- **Current Stack**: HTML5, Vanilla JavaScript, Bootstrap 5, Prism.js
- **Key Features**: Dark mode, keyboard shortcuts, IndexedDB storage
- **Testing**: Jest setup pending (Phase 3)
- **Code Style**: Modular JS, semantic HTML, accessible components

### Backend (FastAPI Python 3.11+)
- **Modern type hints**: `str | None`, `list[str]`, full annotations
- **Circuit Breakers**: PyBreaker on all external API calls
- **Logging**: Structured logging with `structlog` (JSON format)
- **Testing**: pytest with 90.10% coverage achieved ✅
- **Security**: Input validation, Bandit scanning (zero issues)

---

## 📐 Current Project Structure
```
ai-conflict-dashboard/
├── frontend/
│   ├── index.html          # Main UI (Bootstrap + Vanilla JS)
│   ├── comparison-engine.js # Diff algorithm
│   ├── history-manager.js   # IndexedDB storage
│   ├── prism.js            # Syntax highlighting
│   └── prism.css           # Syntax themes
├── backend/
│   ├── main.py             # FastAPI app (100% coverage)
│   ├── llm_providers.py    # API integrations + circuit breakers
│   ├── token_utils.py      # Text chunking (93% coverage)
│   ├── structured_logging.py # Logging config (100% coverage)
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Test suite (59 tests)
├── docs/                   # Comprehensive documentation
├── CLAUDE.md              # This file
└── README.md              # User documentation
```

---

## 🧪 Testing Standards

### Backend (Current)
- **Framework**: pytest + pytest-cov + pytest-asyncio
- **Coverage**: 90.10% achieved ✅
- **Test Files**: 
  - test_api_analyze.py (15 tests)
  - test_llm_providers.py (16 tests)
  - test_structured_logging.py (9 tests)
  - test_token_utils.py (15 tests)
  - test_main.py (4 tests)

### Frontend (Planned - Phase 3)
- Jest and Testing Library
- Target: 85% coverage
- Component and integration tests

---

## 🔒 Security Standards
- ✅ Input validation on all endpoints
- ✅ No dynamic execution (`eval`, `exec`)
- ✅ API keys never logged
- ✅ Bandit security scanning (zero issues)
- ✅ CORS properly configured
- ✅ Type-safe throughout

---

## 📖 Documentation Standards
- ✅ Google-style docstrings for all Python functions
- ✅ Comprehensive inline comments
- ✅ Updated README with current features
- ✅ Phase completion reports in docs/
- ✅ Architecture decisions documented

---

## 🚩 Git Workflow
- Atomic, descriptive commits
- Feature branches for major changes
- Code review before merging
- Maintain clean commit history

---

## 🤖 AI Coding Assistance Workflow

### When Adding New Features:
```
1. Check existing patterns in codebase
2. Write tests first (TDD approach)
3. Implement with type hints and docstrings
4. Run Black, Ruff, and tests
5. Update documentation
```

### AI Code Checklist:
- ✅ Modern Python 3.11+ syntax
- ✅ Type hints on all functions
- ✅ Google-style docstrings
- ✅ Security validation
- ✅ Structured logging calls
- ✅ Circuit breaker for external calls
- ✅ 90%+ test coverage
- ✅ Error handling with root cause fixes

---

## 🚫 Common Pitfalls to Avoid
- Creating duplicate/temporary files
- Weakening or skipping tests to pass
- Ignoring type hints
- Direct console.log or print statements (use structured logging)
- Hardcoding configuration values
- Exposing API keys in logs

---

## 📌 Quick Reference

### Current Stack
| Area             | Tools and Standards                                    |
|------------------|--------------------------------------------------------|
| Frontend         | HTML5, Vanilla JS, Bootstrap 5, Prism.js              |
| Backend          | FastAPI, Python 3.11+, pytest, PyBreaker, structlog   |
| Security         | Bandit (zero issues), input validation                |
| Code Quality     | Black, Ruff (all passing), 90%+ coverage             |
| Documentation    | Google docstrings, Markdown, inline comments          |
| Logging          | structlog with JSON output, request correlation       |
| Error Handling   | Circuit breakers, graceful degradation                |

### Key Metrics Achieved
- Backend Test Coverage: 90.10% ✅
- Security Issues: 0 ✅
- Response Time: <2s ✅
- Code Quality: A+ ✅
- Documentation: Complete ✅

---

## 🏗️ Phase 3 Preparation

When implementing Phase 3 features, maintain these standards:
1. Keep test coverage above 90%
2. Add circuit breakers for new external services
3. Use structured logging for all new endpoints
4. Implement proper error handling
5. Document all architectural decisions

---

This document ensures that the AI Conflict Dashboard maintains production-ready quality standards while remaining flexible for future enhancements.

**Last Updated**: January 2025
**Status**: Production-ready, Phase 1 & 2 complete