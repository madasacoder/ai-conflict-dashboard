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
- ✅ **FIXED**: All `_fixed` files have been merged back into original files and imports updated.

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

### Frontend (Vanilla JavaScript + Bootstrap)
- **Current Stack**: HTML5, Vanilla JavaScript, Bootstrap 5, Prism.js, DOMPurify
- **Key Features**: Dark mode, file upload, model selection, Ollama support, checkboxes
- **Testing**: Vitest + Playwright for e2e tests
- **Code Style**: Modular JS, semantic HTML, accessible components

### Backend (FastAPI Python 3.11+)
- **Modern type hints**: `str | None`, `list[str]`, full annotations
- **Circuit Breakers**: PyBreaker per-API-key isolation
- **Logging**: Structured logging with `structlog` (JSON format)
- **Testing**: pytest with 92.23% coverage achieved ✅
- **Security**: Rate limiting, CORS, XSS protection, timeout handling

---

## 📐 Current Project Structure
```
ai-conflict-dashboard/
├── frontend/
│   ├── index.html          # Main UI (Vanilla JS + Bootstrap)
│   ├── js/
│   │   ├── xss-protection.js
│   │   └── file-upload-fix.js
│   ├── e2e/               # Playwright tests
│   └── tests/             # Vitest tests
├── backend/
│   ├── main.py            # FastAPI app with Ollama support
│   ├── llm_providers.py   # API integrations (OpenAI, Claude, Gemini, Grok, Ollama)
│   ├── token_utils.py     # Text chunking
│   ├── structured_logging.py # Logging config
│   ├── cors_config.py     # CORS security
│   ├── rate_limiting.py   # Rate limiter
│   ├── memory_management.py # Memory controls
│   ├── timeout_handler.py # Timeout handling
│   ├── smart_chunking.py  # Smart text splitting
│   ├── plugins/
│   │   └── ollama_provider.py # Ollama integration
│   └── tests/             # Test suite (100+ tests)
├── logs/                  # Application logs
├── temporary_files/       # For temporary work (per rule #2)
├── docs/                  # Comprehensive documentation
├── CLAUDE.md             # This file
└── README.md             # User documentation
```

---

## 🧪 Testing Standards

### Backend (Current)
- **Framework**: pytest + pytest-cov + pytest-asyncio
- **Coverage**: 92.23% achieved ✅
- **Test Files**: 
  - test_api_analyze.py
  - test_llm_providers.py 
  - test_structured_logging.py
  - test_token_utils.py
  - test_main.py
  - test_security_comprehensive.py
  - test_adversarial.py
  - test_real_bugs.py
  - test_ollama_integration.py

### Frontend (Enhanced - TypeScript Ready)
- **TypeScript**: Full TypeScript support with strict mode
- **ESLint + TypeScript**: Complete type-aware linting
- **Biome**: High-performance alternative (10-100x faster)
- **Vitest + Testing Library**: TypeScript-aware testing
- **Security**: npm audit + Snyk integration
- **Coverage**: 85%+ target with comprehensive test suite

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

## 📝 TypeScript Development Standards

### 🎯 TypeScript Toolchain Overview
The project implements a **comprehensive, free CLI toolchain** for TypeScript:

#### **Core Tools Configured**
- **TypeScript Compiler (tsc)**: Strict type-checking with `--noEmit`
- **ESLint + TypeScript**: Complete type-aware linting
- **Biome**: Rust-powered alternative (10-100x faster than ESLint+Prettier)
- **Prettier**: Consistent code formatting
- **Security**: npm audit + Snyk vulnerability scanning
- **Testing**: Vitest/Jest with full TypeScript support

#### **Quick TypeScript Commands**
```bash
# Desktop App (React + TypeScript)
cd desktop-app
npm run type-check              # TypeScript validation
npm run lint                     # ESLint + TypeScript
npm run biome:check             # Fast alternative linting
npm run quality                 # Full quality check
npm run validate                # Type-check + lint + test

# Frontend (Vanilla JS → TypeScript)
cd frontend  
npm run type-check              # TypeScript validation
npm run check                   # All quality checks
npm run check:biome             # Biome-based validation

# Project-wide validation
./validate-typescript.sh         # Comprehensive validation
```

#### **TypeScript Configuration Standards**
- **Strict Mode**: `strict: true` + additional strict options
- **No Unchecked Access**: `noUncheckedIndexedAccess: true`
- **Exact Optional Types**: `exactOptionalPropertyTypes: true`
- **No Unused Variables**: `noUnusedLocals: true`
- **No Implicit Returns**: `noImplicitReturns: true`

#### **Biome vs ESLint + Prettier**
| Feature | ESLint + Prettier | Biome |
|---------|------------------|-------|
| Performance | Moderate | 10-100x faster |
| Setup | Multiple tools | Single tool |
| Ecosystem | Mature | Growing |
| TypeScript | Excellent | Excellent |

**Recommendation**: Both tools are configured. Use Biome for speed, ESLint for maximum ecosystem support.

#### **TypeScript Quality Gates**
- ✅ **Type Safety**: Zero TypeScript errors allowed
- ✅ **Strict Mode**: All new TypeScript files use strict configuration
- ✅ **No `any` Types**: Explicit typing required (exceptions documented)
- ✅ **Import Organization**: Automatic import sorting and cleanup
- ✅ **Security Scanning**: TypeScript dependencies scanned for vulnerabilities

#### **Documentation**
See `TYPESCRIPT_TOOLCHAIN.md` for complete setup and usage guide.

---

## 🤖 AI Coding Assistance Workflow

### When Adding New Features:
```
1. Check existing patterns in codebase
2. Write tests first (TDD approach)
3. Implement with type hints and docstrings
4. Run quality checks: make lint format test
5. Use pre-commit hooks (auto-installed)
6. Update documentation
```

### **🛠️ Toolchain Requirements (MANDATORY)**

All code changes MUST pass these automated checks:

#### **Python Backend**
```bash
# Before committing Python code:
cd backend
./venv/bin/ruff check . --fix    # Auto-fix linting issues
./venv/bin/black .               # Format code
./venv/bin/mypy .                # Type checking
./venv/bin/bandit -r .           # Security scan
./venv/bin/pytest               # Run tests with 90%+ coverage
```

#### **JavaScript Frontend**
```bash
# Before committing JavaScript code:
cd frontend
npm run lint:fix                 # Fix ESLint issues
npm run format                   # Format with Prettier
npm run security                 # Security scan
npm test                         # Unit tests
npm run test:e2e                 # E2E tests
```

#### **Rust Desktop App**
```bash
# Before committing Rust code:
cd desktop-app/src-tauri
cargo fmt                        # Format code
cargo clippy -- -D warnings     # Strict linting
cargo audit                      # Security audit
cargo test                       # Run tests
```

#### **Quick Commands (All Components)**
```bash
# From project root:
make quality                     # Run all quality checks
make format                      # Format all code
make lint                        # Lint all code
make test                        # Run all tests
make security                    # Run all security scans
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
- ✅ **TOOLCHAIN COMPLIANCE**: All code must pass quality checks
- ✅ **PRE-COMMIT HOOKS**: Run automatically on commit
- ✅ **FORMAT CHECK**: Use `make format` before committing
- ✅ **TYPESCRIPT STRICT**: All TypeScript code uses strict mode
- ✅ **TYPE SAFETY**: Complete type coverage for TypeScript files
- ✅ **BIOME READY**: Fast alternative to ESLint + Prettier available

---

## 🚫 Common Pitfalls to Avoid
- Creating duplicate/temporary files
- Weakening or skipping tests to pass
- Ignoring type hints
- Direct console.log or print statements (use structured logging)
- Hardcoding configuration values
- Exposing API keys in logs
- **TOOLCHAIN VIOLATIONS:**
  - ❌ Committing without running `make quality`
  - ❌ Bypassing pre-commit hooks with `--no-verify`
  - ❌ Using deprecated type annotations (`typing.List` vs `list`)
  - ❌ Ignoring linting errors (Ruff, ESLint, Clippy)
  - ❌ Not fixing security vulnerabilities (Bandit, npm audit)
  - ❌ Unsafe DOM manipulation (XSS vulnerabilities)
  - ❌ **TYPESCRIPT VIOLATIONS:**
    - ❌ Using `any` type without justification
    - ❌ Ignoring TypeScript errors with `@ts-ignore`
    - ❌ Not using strict null checks (`noUncheckedIndexedAccess`)
    - ❌ Missing type annotations in function signatures
    - ❌ Not fixing Biome/ESLint TypeScript warnings

---

## 📌 Quick Reference

### Current Stack
| Area             | Tools and Standards                                    |
|------------------|--------------------------------------------------------|
| Frontend         | HTML5, Vanilla JS → TypeScript, Bootstrap 5, Prism.js |
| Desktop App      | React + TypeScript, Tauri, Vite, Vitest              |
| Backend          | FastAPI, Python 3.11+, pytest, PyBreaker, structlog, google-generativeai |
| TypeScript       | tsc (strict), ESLint + TS, Biome, Prettier, Snyk     |
| Security         | Bandit (zero issues), npm audit, Snyk, input validation |
| Code Quality     | Black, Ruff, ESLint, Biome (all passing), 90%+ coverage |
| Documentation    | Google docstrings, JSDoc, Markdown, inline comments   |
| Logging          | structlog with JSON output, request correlation       |
| Error Handling   | Circuit breakers, graceful degradation                |
| **Toolchain**    | **Ruff, Black, MyPy, Bandit, ESLint, Prettier, Clippy** |
| **Automation**   | **Pre-commit hooks, Makefile, CI/CD integration**     |
| **Quality Gates**| **90% Python coverage, 85% JS coverage, 0 security issues** |

### Key Metrics Achieved
- Backend Test Coverage: 92.23% ✅
- Security Issues: 0 ✅
- Response Time: <2s ✅
- Code Quality: A+ ✅
- Documentation: Complete ✅
- AI Models Supported: 5 (OpenAI, Claude, Gemini, Grok, Ollama) ✅

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