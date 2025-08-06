# Code Quality Scripts Report - AI Conflict Dashboard

## Date: 2025-08-04

## Executive Summary
The AI Conflict Dashboard has comprehensive code quality tooling across Python, JavaScript/TypeScript, and Rust. There are multiple ways to run quality checks: via Makefile, shell scripts, or npm/Python commands directly.

---

## 🎯 Quick Start Commands

### Run ALL Quality Checks (Recommended)
```bash
# From project root - runs everything
make quality

# Or use the shell script
./run-all-quality-checks.sh
```

### Component-Specific Quality Checks
```bash
# Backend (Python) only
cd backend && ./run-quality-checks.sh

# Frontend (JavaScript) only
cd frontend && ./run-quality-checks.sh

# Desktop app only
cd desktop-app && npm run quality
```

---

## 📁 Available Quality Scripts

### 1. **Master Makefile** (`/Makefile`)
The main entry point for all quality checks across the entire project.

**Key Commands:**
- `make quality` - Run ALL quality checks (lint, format, test, security)
- `make lint` - Run all linters
- `make format` - Run all formatters
- `make test` - Run all tests
- `make security` - Run security scans
- `make install` - Install all dependencies
- `make clean` - Clean generated files

### 2. **Shell Scripts**

#### `/run-all-quality-checks.sh`
Master script that runs quality checks for both backend and frontend.
- Provides colored output
- Shows pass/fail status for each component
- Generates coverage reports

#### `/backend/run-quality-checks.sh`
Python-specific quality checks:
1. **Black** - Code formatting (PEP 8)
2. **Ruff** - Fast Python linter
3. **Bandit** - Security vulnerability scanner
4. **MyPy** - Static type checking
5. **Pytest** - Tests with >90% coverage requirement

#### `/frontend/run-quality-checks.sh`
JavaScript-specific quality checks:
1. **ESLint** - JavaScript/TypeScript linting
2. **Prettier** - Code formatting
3. **npm audit** - Security vulnerability check
4. **Console.log check** - Finds debug statements
5. **XSS check** - Finds unsafe innerHTML usage
6. **Vitest** - Tests with coverage
7. **Plato** - Code complexity analysis

### 3. **Desktop App Makefile** (`/desktop-app/Makefile`)
Desktop-specific commands:
- `make lint` - Run ESLint + Ruff + MyPy
- `make format` - Run Prettier + Black + Ruff
- `make test` - Run frontend + backend tests
- `make setup` - Complete initial setup

---

## 🛠️ Quality Tools by Language

### Python (Backend)
| Tool | Purpose | Command | Config |
|------|---------|---------|--------|
| **Black** | Code formatter | `black .` | pyproject.toml |
| **Ruff** | Linter & formatter | `ruff check .` | pyproject.toml |
| **Bandit** | Security scanner | `bandit -r .` | .bandit |
| **MyPy** | Type checker | `mypy .` | pyproject.toml |
| **Pytest** | Test runner | `pytest --cov` | pytest.ini |

### JavaScript/TypeScript (Frontend & Desktop)
| Tool | Purpose | Command | Config |
|------|---------|---------|--------|
| **ESLint** | Linter | `npm run lint` | .eslintrc / package.json |
| **Prettier** | Formatter | `npm run format` | .prettierrc |
| **Vitest** | Test runner | `npm test` | vitest.config.ts |
| **Playwright** | E2E tests | `npm run test:e2e` | playwright.config.ts |
| **Plato** | Complexity | `npm run quality` | - |
| **Biome** | Alt linter | `npm run biome:lint` | biome.json |

### Rust (Desktop Tauri)
| Tool | Purpose | Command | Config |
|------|---------|---------|--------|
| **Cargo fmt** | Formatter | `cargo fmt` | rustfmt.toml |
| **Cargo clippy** | Linter | `cargo clippy` | clippy.toml |
| **Cargo test** | Test runner | `cargo test` | - |
| **Cargo audit** | Security | `cargo audit` | - |

---

## 📊 Coverage Requirements

### Backend (Python)
- **Minimum**: 90% coverage
- **Current**: 92.23% ✅
- **Report**: `backend/htmlcov/index.html`

### Frontend (JavaScript)
- **Target**: 85% coverage
- **Report**: `frontend/coverage/index.html`

### Desktop App
- **Target**: 85% coverage
- **Report**: `desktop-app/coverage/index.html`

---

## 🔒 Security Checks

### Python Security
```bash
cd backend
./venv/bin/bandit -r . -f json -o bandit_report.json
```
- Checks for: SQL injection, hardcoded passwords, insecure random, etc.

### JavaScript Security
```bash
cd frontend
npm audit              # Check dependencies
npm run security       # Additional security checks
```
- Checks for: XSS vulnerabilities, dependency vulnerabilities, unsafe DOM manipulation

### Rust Security
```bash
cd desktop-app/src-tauri
cargo audit
```
- Checks for: Known vulnerabilities in Rust dependencies

---

## 📋 NPM Scripts Available

### Frontend (`/frontend/package.json`)
```json
"test": "vitest"
"test:coverage": "vitest --coverage"
"test:e2e": "playwright test"
"lint": "eslint 'js/**/*.{js,ts,jsx,tsx}'"
"lint:fix": "eslint --fix"
"format": "prettier --write"
"format:check": "prettier --check"
"quality": "plato -r -d reports/plato js"
"security": "npm audit fix"
```

### Desktop App (`/desktop-app/package.json`)
```json
"test": "vitest"
"test:coverage": "vitest --coverage"
"test:e2e": "playwright test -c playwright-ct.config.ts"
"lint": "eslint src --ext .js,.jsx,.ts,.tsx"
"format": "prettier --write 'src/**/*.{js,jsx,ts,tsx,css,md}'"
"quality": "npm run lint && npm run type-check && npm run test"
```

---

## 🚀 Recommended Workflow

### Before Committing Code
```bash
# 1. Format your code
make format

# 2. Run quality checks
make quality

# 3. If issues found, fix them:
cd backend && black . && ruff check --fix .
cd frontend && npm run lint:fix && npm run format
```

### Full Quality Check
```bash
# From project root, run everything:
./run-all-quality-checks.sh

# Or use Make:
make quality
```

### Quick Component Check
```bash
# Just backend
cd backend && ./run-quality-checks.sh

# Just frontend  
cd frontend && ./run-quality-checks.sh

# Just desktop
cd desktop-app && npm run quality
```

---

## 📈 Quality Metrics

### Current Status
- **Backend**: All quality checks passing ✅
  - Black: Formatted
  - Ruff: No issues
  - Bandit: 0 security issues
  - MyPy: Type checks pass
  - Pytest: 92.23% coverage

- **Frontend**: Quality checks configured ✅
  - ESLint: Configured with TypeScript
  - Prettier: Auto-formatting ready
  - Security: npm audit configured
  - Tests: Vitest + Playwright ready

- **Desktop**: Quality checks configured ✅
  - TypeScript: Strict mode
  - React: ESLint rules
  - Rust: Clippy + fmt configured

---

## 🔧 Configuration Files

### Python
- `pyproject.toml` - Black, Ruff, MyPy config
- `pytest.ini` - Pytest configuration
- `.bandit` - Bandit security config

### JavaScript/TypeScript
- `package.json` - ESLint config inline
- `.prettierrc` - Prettier formatting rules
- `vitest.config.ts` - Test configuration
- `playwright.config.ts` - E2E test config
- `biome.json` - Alternative linter config
- `tsconfig.json` - TypeScript config

### Rust
- `rustfmt.toml` - Rust formatting rules
- `clippy.toml` - Clippy linter rules
- `Cargo.toml` - Dependencies and metadata

---

## 🏃 Performance Tips

### Fastest Quality Check
```bash
# Just lint (no tests)
make lint
```

### Most Thorough Check
```bash
# Everything including security
make quality
```

### Parallel Execution
```bash
# Run backend and frontend in parallel
(cd backend && ./run-quality-checks.sh) & 
(cd frontend && ./run-quality-checks.sh) &
wait
```

---

## 📝 Pre-commit Hooks

Install pre-commit hooks to run quality checks automatically:
```bash
make pre-commit
```

This will check code quality before each commit.

---

## 🆘 Troubleshooting

### Python Tools Not Found
```bash
cd backend
./venv/bin/pip install -r requirements.txt
```

### Node Tools Not Found
```bash
cd frontend
npm install
```

### Rust Tools Not Found
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install cargo-audit
```

---

## 📊 Summary

The project has **excellent code quality tooling** with:
- ✅ Multiple ways to run checks (Make, shell scripts, npm)
- ✅ Comprehensive coverage across all languages
- ✅ Security scanning built-in
- ✅ Automated formatting available
- ✅ High test coverage requirements (90%+)
- ✅ Pre-commit hooks available

**Recommended command for full quality check:**
```bash
make quality
```

This ensures your code meets all quality standards before committing.