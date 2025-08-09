# 📗 Claude Project Instructions - AI Conflict Dashboard

This document defines explicit rules and instructions for AI coding assistants (Claude, Cursor) when contributing to the AI Conflict Dashboard.

---

## 🚀 Project Philosophy
The AI Conflict Dashboard transparently orchestrates multiple AI models, providing clear insights, consensus, and explicit conflict resolution, enabling informed editing decisions.

**Current Status (authoritative as of latest local run)**
- Backend tests: 319 passed, 108 failed, 13 skipped, 23 errors (pytest)
- Backend coverage (overall): ~51% (pytest-cov)
- UI type-check: failing with ~800+ TypeScript errors (strict mode)
- Playwright E2E: failing (selectors/entry-flow mismatch)
- Security scans: issues present (Bandit findings in tooling scripts; npm audit not yet evaluated here)
- Providers: OpenAI/Claude/Ollama implemented; Gemini/Grok are mock-only
- Production readiness: NOT READY

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
- Quality gates are targets (not current): 90%+ backend coverage, 85%+ frontend coverage.

---

## 💻 Technical Guidelines

### Frontend (Primary: React + TypeScript in `ui/`; Legacy: Vanilla in `frontend/`)
- **Primary Stack (ui/)**: React 18, TypeScript (strict), Vite, React Flow, Zustand, DOMPurify
- **Legacy (frontend/)**: HTML5 + Vanilla JS + Bootstrap; retained for historical context only
- **Testing**: Vitest (unit), Playwright (E2E) under `ui/`
- **Note**: Some backend tests still point to legacy `../frontend/*` files; these paths need migration to the modern `ui/` app or test updates.

### Backend (FastAPI Python 3.11+)
- **Modern type hints**: `str | None`, `list[str]`, full annotations
- **Circuit Breakers**: PyBreaker per-API-key isolation (race condition issues remain under concurrency)
- **Logging**: Structured logging with `structlog` (JSON);
  API key sanitization implemented but needs verification end-to-end
- **Testing**: pytest; current suite has significant failures and some tests that assume a live server
- **Security**: Rate limiting, CORS, XSS protection, timeout handling present but with gaps

---

## 📐 Current Project Structure
```
ai-conflict-dashboard/
├── ui/                    # Primary web/desktop app (React + TS + Vite + Playwright)
│   ├── src/
│   ├── playwright-tests/
│   ├── playwright.config.ts
│   └── src-tauri/         # Desktop (Tauri)
├── frontend/              # Legacy vanilla JS app (not primary)
│   └── js/
├── backend/               # FastAPI API server and tests
│   ├── main.py
│   ├── llm_providers.py   # OpenAI/Claude/Ollama implemented; Gemini/Grok mock-only
│   ├── ...                # rate_limiting, smart_chunking, memory_management, etc.
│   └── tests/
├── docs/
├── logs/
└── temporary_files/
```

---

## 🧪 Testing Standards

### Backend (Current)
- **Framework**: pytest + pytest-cov + pytest-asyncio
- **Coverage (latest run)**: ~51% overall; significant module gaps
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
- **Coverage target**: 85%+ (current status below)

---

## 🔒 Security Standards
- Input validation on all endpoints (gaps remain; see BUGS/CRITICAL_ISSUES)
- No dynamic execution (`eval`, `exec`)
- API keys should never be logged (sanitization in place but must be validated end-to-end)
- Bandit security scanning: issues present in scripts and dependencies; treat findings as backlog
- CORS properly configured (env-based)
- Type safety: enforced in principle; current UI strict errors need resolution

---

## 📖 Documentation Standards
- Google-style docstrings for Python functions (work in progress)
- Comments and ADRs where helpful
- READMEs reflect current status (kept accurate; avoid aspirational claims)
- Phase completion reports in `docs/` (truthful and dated)

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

#### **Quick TypeScript Commands (ui/)**
```bash
cd ui
npm ci --no-audit --no-fund
npm run type-check              # TypeScript validation (strict)
npm run lint                    # ESLint + TypeScript
npm run test -- --run           # Vitest unit tests
npx playwright install
npx playwright test             # Browser E2E tests
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
cd backend
./venv/bin/ruff check . --fix    # Lint (expect failures currently)
./venv/bin/black .               # Format
./venv/bin/mypy .                # Type check (expect failures currently)
./venv/bin/bandit -r . -x venv   # Security scan
./venv/bin/pytest                # Run tests (expect failures/errors)
```

#### **JavaScript/TypeScript Frontend (ui/)**
```bash
cd ui
npm run lint:fix                 # Fix ESLint issues
npm run format                   # Format with Prettier
npm audit                        # Security scan
npm test -- --run                # Unit tests (expect TS errors currently)
npx playwright test              # E2E tests (expect selector/flow failures)
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
| Security         | Bandit, npm audit, Snyk (issues outstanding), input validation |
| Code Quality     | Black, Ruff, ESLint, Biome (targets; current runs failing) |
| Documentation    | Google docstrings, JSDoc, Markdown, inline comments   |
| Logging          | structlog with JSON output, request correlation       |
| Error Handling   | Circuit breakers, graceful degradation                |
| **Toolchain**    | **Ruff, Black, MyPy, Bandit, ESLint, Prettier, Clippy** |
| **Automation**   | **Pre-commit hooks, Makefile, CI/CD integration**     |
| **Quality Gates**| **90% Python coverage, 85% JS coverage, 0 security issues** |

### Current Metrics (latest local run)
- Backend tests: 319 passed, 108 failed, 23 errors; ~51% coverage
- UI: Type-check failing with hundreds of strict errors; E2E flows not launching
- Security: Findings outstanding (see `docs/BUGS.md` and `docs/CRITICAL_ISSUES.md`)
- Providers: 3 real (OpenAI, Claude, Ollama), 2 mock (Gemini, Grok)

---

## 🏗️ Phase 3 Preparation

When implementing Phase 3 features, maintain these standards:
1. Raise test coverage toward 90% (target)
2. Add circuit breakers for new external services
3. Use structured logging for all new endpoints
4. Implement proper error handling
5. Document all architectural decisions

---

This document defines standards and reflects the current status. Keep it honest and aligned with real test/security results.

**Last Updated**: August 2025
**Status**: Development application, Phase 1 & 2 partially complete, NOT production-ready