# AI Conflict Dashboard - Toolchain Documentation

This document provides comprehensive documentation for the production-grade toolchain implemented across the AI Conflict Dashboard project.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Tool Configurations](#tool-configurations)
- [Usage Guide](#usage-guide)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Quality Standards](#quality-standards)
- [Troubleshooting](#troubleshooting)

## Overview

The AI Conflict Dashboard uses a modern, multi-language toolchain that enforces:
- **Code Quality**: Consistent formatting and linting
- **Security**: Vulnerability scanning and safe coding practices
- **Type Safety**: Static type checking
- **Testing**: Comprehensive test coverage requirements
- **Automation**: Pre-commit hooks and CI/CD integration

### Languages & Tools

| Language | Linting | Formatting | Type Checking | Security | Testing |
|----------|---------|------------|---------------|----------|---------|
| **Python** | Ruff | Black + Ruff | MyPy | Bandit | pytest |
| **JavaScript** | ESLint | Prettier | JSDoc | ESLint Security | Vitest + Playwright |
| **Rust** | Clippy | rustfmt | Built-in | cargo-audit | cargo test |

## Quick Start

### Install All Dependencies
```bash
# Run once to set up everything
make install
```

### Run Quality Checks
```bash
# Check everything
make quality

# Individual components
make frontend-lint
make backend-lint
make desktop-lint
```

### Auto-fix Issues
```bash
# Format all code
make format

# Fix linting issues
make lint
```

## Tool Configurations

### Python Backend (`backend/`)

#### Configuration Files:
- **`pyproject.toml`** - Central configuration for all Python tools
- **`pytest.ini`** - Test configuration
- **`requirements.txt`** - Dependencies

#### Tools:

**Ruff** (Fast Python Linter)
```toml
[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "W", "F", "I", "N", "UP", "B", "C4", "DTZ", "RUF", "S", "T20", "SIM", "PTH"]
```

**Black** (Code Formatter)
```toml
[tool.black]
line-length = 100
target-version = ['py311']
```

**MyPy** (Type Checker)
```toml
[tool.mypy]
python_version = "3.11"
disallow_untyped_defs = true
strict_equality = true
```

**Bandit** (Security Scanner)
```toml
[tool.bandit]
exclude_dirs = ["tests", "venv", ".venv"]
skips = ["B101"]  # Skip assert_used in tests
```

**pytest** (Testing Framework)
```toml
[tool.pytest.ini_options]
addopts = ["--cov=.", "--cov-fail-under=90"]
```

### JavaScript Frontend (`frontend/`)

#### Configuration Files:
- **`package.json`** - ESLint configuration and scripts
- **`.prettierrc`** - Prettier formatting rules
- **`.eslintrc.security.cjs`** - Security-specific ESLint rules

#### Tools:

**ESLint** (Linting + Security)
```javascript
{
  "extends": ["eslint:recommended"],
  "plugins": ["security", "no-secrets", "jsdoc", "sonarjs"],
  "rules": {
    "no-console": "off",  // Use structured logging instead
    "security/detect-eval-with-expression": "error",
    "no-secrets/no-secrets": "error"
  }
}
```

**Prettier** (Code Formatting)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Security Plugins**:
- `eslint-plugin-security` - Detects potential security issues
- `eslint-plugin-no-secrets` - Prevents API keys in code
- `eslint-plugin-no-unsanitized` - Prevents XSS vulnerabilities

### Rust Desktop App (`desktop-app/src-tauri/`)

#### Configuration Files:
- **`rustfmt.toml`** - Formatting configuration
- **`clippy.toml`** - Linting configuration
- **`rust-toolchain.toml`** - Rust version management

#### Tools:

**rustfmt** (Code Formatter)
```toml
max_width = 100
newline_style = "Unix"
hard_tabs = false
tab_spaces = 4
edition = "2021"
```

**Clippy** (Linter)
```toml
cognitive-complexity-threshold = 30
too-many-lines-threshold = 100
too-many-arguments-threshold = 7
msrv = "1.70.0"
```

**cargo-audit** (Security Scanner)
```bash
cargo install cargo-audit
cargo audit
```

## Usage Guide

### Daily Development Workflow

1. **Start working**:
   ```bash
   # Pull latest changes
   git pull
   
   # Install any new dependencies
   make install
   ```

2. **Make changes**:
   ```bash
   # Edit your code
   vim src/file.py
   ```

3. **Check quality**:
   ```bash
   # Quick check
   make lint format
   
   # Full quality check
   make quality
   ```

4. **Commit changes**:
   ```bash
   # Pre-commit hooks run automatically
   git add .
   git commit -m "feat: add new feature"
   ```

### Component-Specific Commands

#### Backend (Python)
```bash
cd backend

# Linting
./venv/bin/ruff check .                    # Check for issues
./venv/bin/ruff check . --fix              # Auto-fix issues

# Formatting
./venv/bin/black .                         # Format code
./venv/bin/black . --check                 # Check formatting

# Type checking
./venv/bin/mypy .                          # Type check

# Security
./venv/bin/bandit -r . -f screen           # Security scan

# Testing
./venv/bin/pytest                         # Run tests
./venv/bin/pytest --cov=. --cov-report=html  # With coverage
```

#### Frontend (JavaScript)
```bash
cd frontend

# Linting
npm run lint                               # Check for issues
npm run lint:fix                           # Auto-fix issues

# Formatting
npm run format                             # Format code
npm run format:check                       # Check formatting

# Security
npm audit                                  # Dependency scan
npm run security                           # ESLint security scan

# Testing
npm test                                   # Unit tests
npm run test:e2e                           # E2E tests
npm run test:coverage                      # Coverage report
```

#### Desktop App (Rust)
```bash
cd desktop-app/src-tauri

# Formatting
cargo fmt                                  # Format code
cargo fmt -- --check                      # Check formatting

# Linting
cargo clippy                              # Basic linting
cargo clippy -- -D warnings              # Strict linting

# Security
cargo audit                               # Security scan

# Testing
cargo test                                # Run tests
```

## Pre-commit Hooks

### Installation
```bash
# Install hooks (one-time setup)
make pre-commit

# Or manually:
pip install pre-commit
pre-commit install
```

### What Runs on Commit

The pre-commit hooks automatically run:

1. **General**:
   - Trailing whitespace removal
   - End-of-file fixer
   - YAML/JSON/TOML validation
   - Large file detection
   - Merge conflict detection

2. **Python**:
   - Black formatting
   - Ruff linting and formatting
   - MyPy type checking (non-test files)
   - Bandit security scanning (non-test files)

3. **JavaScript**:
   - ESLint with security rules
   - Prettier formatting

4. **Rust**:
   - cargo fmt formatting
   - cargo clippy linting

5. **Security**:
   - Secret detection
   - Markdown formatting

### Bypassing Hooks (Emergency Only)
```bash
# Skip all hooks (use sparingly)
git commit --no-verify -m "emergency fix"

# Skip specific hook
SKIP=eslint git commit -m "skip eslint"
```

## Quality Standards

### Code Coverage Requirements
- **Backend**: 90%+ (enforced by pytest)
- **Frontend**: 85%+ (target for Vitest)
- **Desktop**: 80%+ (target for cargo test)

### Security Standards
- **Zero vulnerabilities** in security scans
- **No hardcoded secrets** in code
- **XSS protection** for all user inputs
- **Input validation** on all endpoints

### Code Style Standards
- **Line length**: 100 characters max
- **Type hints**: Required for all Python functions
- **JSDoc comments**: Required for public JavaScript functions
- **Error handling**: All errors must be properly handled and logged

### Performance Standards
- **Build time**: < 2 minutes for full build
- **Test time**: < 30 seconds for unit tests
- **Startup time**: < 5 seconds for development server

## Troubleshooting

### Common Issues

#### "Pre-commit hook failed"
```bash
# Fix the issue and try again
make format lint
git add .
git commit -m "fix: formatting issues"
```

#### "Ruff configuration warnings"
The deprecation warnings about top-level settings can be ignored. The configuration works correctly.

#### "MyPy missing imports"
Add missing type stubs to `pyproject.toml`:
```toml
[[tool.mypy.overrides]]
module = ["missing_module.*"]
ignore_missing_imports = true
```

#### "npm audit vulnerabilities"
```bash
# Try automatic fix
npm audit fix

# Force fix (may cause breaking changes)
npm audit fix --force

# Update specific package
npm update package-name
```

#### "Rust build fails"
```bash
# Clean and rebuild
cargo clean
cargo build

# Update Rust toolchain
rustup update
```

### Performance Optimization

#### Faster Python Linting
```bash
# Use ruff instead of multiple tools
./venv/bin/ruff check . --fix    # Combines isort, pycodestyle, pyflakes
```

#### Faster JavaScript Testing
```bash
# Run tests in parallel
npm test -- --reporter=verbose --threads

# Use file watching
npm test -- --watch
```

#### Faster Rust Compilation
```bash
# Use release profile for faster builds
cargo build --release

# Use parallel compilation
export CARGO_BUILD_JOBS=8
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Quality Checks
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: make install
      - name: Quality Checks
        run: make quality
```

### Git Hooks for Teams
```bash
# Share hooks across team
cp .pre-commit-config.yaml .git/hooks/
chmod +x .git/hooks/*
```

## Summary

This toolchain provides:
- ✅ **Automated quality checks** with pre-commit hooks
- ✅ **Security scanning** for all languages
- ✅ **Consistent formatting** across the codebase
- ✅ **Type safety** where applicable
- ✅ **Test coverage** enforcement
- ✅ **Easy commands** for daily development

For detailed component-specific documentation, see:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Desktop App README](desktop-app/README.md)