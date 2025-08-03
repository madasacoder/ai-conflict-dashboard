# Code Quality Guide - AI Conflict Dashboard

This guide provides comprehensive instructions for running code quality checks across the entire codebase (Python backend and JavaScript frontend).

## 🛠️ Tools Overview

### Python (Backend)
- **Black**: Code formatter (PEP 8 compliant)
- **Ruff**: Fast Python linter combining multiple tools
- **Bandit**: Security vulnerability scanner
- **MyPy**: Static type checker
- **pytest**: Testing framework with coverage

### JavaScript (Frontend)
- **ESLint**: JavaScript linter with strict rules
- **Prettier**: Code formatter
- **Vitest**: Unit testing framework
- **Playwright**: E2E testing framework
- **Plato**: Code complexity analysis
- **JSHint**: Additional JavaScript linting

## 🚀 Quick Start - Run All Checks

### Backend (Python)
```bash
cd backend

# Run all quality checks
black . && ruff check . && bandit -r . && mypy . && pytest --cov

# Or create a script:
./run-quality-checks.sh
```

### Frontend (JavaScript)
```bash
cd frontend

# Run all quality checks
npm run check

# This runs: lint + format:check + security
```

## 📋 Detailed Commands

### Python Backend Quality Checks

#### 1. Code Formatting with Black
```bash
cd backend

# Check formatting issues (dry run)
black --check .

# Auto-format all Python files
black .

# Format specific file
black main.py

# Format with line length 120 (as per CLAUDE.md)
black --line-length 120 .
```

#### 2. Linting with Ruff
```bash
cd backend

# Check for linting issues
ruff check .

# Auto-fix safe issues
ruff check --fix .

# Show detailed error explanations
ruff check --show-source .

# Check specific rule categories
ruff check --select E,W,F .  # Errors, Warnings, PyFlakes
```

#### 3. Security Scanning with Bandit
```bash
cd backend

# Run security scan
bandit -r .

# Generate detailed report
bandit -r . -f json -o security-report.json

# Exclude test files
bandit -r . -x ./tests

# High severity issues only
bandit -r . -ll
```

#### 4. Type Checking with MyPy
```bash
cd backend

# Run type checking
mypy .

# Strict mode
mypy --strict .

# Check specific file
mypy main.py

# Generate HTML report
mypy . --html-report mypy-report
```

#### 5. Test Coverage
```bash
cd backend

# Run tests with coverage
pytest --cov=. --cov-report=html

# Specific coverage threshold (92% as achieved)
pytest --cov=. --cov-fail-under=92

# View coverage report
open htmlcov/index.html
```

### JavaScript Frontend Quality Checks

#### 1. Linting with ESLint
```bash
cd frontend

# Run ESLint (configured to fail on any warnings)
npm run lint

# Auto-fix issues
npm run lint:fix

# Check specific file/directory
npx eslint js/workflow-builder.js

# Show detailed rule violations
npx eslint js/**/*.js --format=stylish
```

#### 2. Code Formatting with Prettier
```bash
cd frontend

# Check formatting issues
npm run format:check

# Auto-format all files
npm run format

# Format specific file types
npx prettier --write "**/*.{js,json,md,html}"
```

#### 3. Security Checks
```bash
cd frontend

# Run security audit
npm run security

# This runs:
# - npm audit (dependency vulnerabilities)
# - ESLint with security rules

# Fix vulnerabilities
npm audit fix

# Force fixes (use cautiously)
npm audit fix --force
```

#### 4. Code Complexity Analysis
```bash
cd frontend

# Generate Plato report
npm run quality

# View report
open reports/plato/index.html

# The report shows:
# - Complexity metrics
# - Maintainability index
# - Lines of code
# - Estimated errors
```

#### 5. Test Coverage
```bash
cd frontend

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html

# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:ui
```

## 🔧 Configuration Files

### Python Configuration

#### pyproject.toml (Black + Ruff)
```toml
[tool.black]
line-length = 120
target-version = ['py311']
include = '\.pyi?$'

[tool.ruff]
line-length = 120
target-version = "py311"
select = ["E", "W", "F", "I", "N", "B", "S"]
ignore = ["E501"]  # Line too long (handled by Black)
```

#### .bandit
```yaml
exclude_dirs:
  - tests
  - venv
skips:
  - B101  # Use of assert (common in tests)
```

### JavaScript Configuration

#### .eslintrc.json
```json
{
  "rules": {
    "no-console": "error",
    "no-eval": "error",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### .prettierrc
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

## 🏃 Pre-Commit Hooks

The project uses Git hooks to ensure code quality:

### Setup
```bash
cd frontend
npm install  # This runs prepare script which installs husky

# Hooks are configured in .husky/pre-commit
```

### What runs on commit:
1. ESLint on staged JavaScript files
2. Prettier formatting check
3. Unit tests for modified files

## 📊 Quality Metrics & Standards

### Python Backend
- **Test Coverage**: Minimum 90% (currently 92.23%)
- **Security Issues**: 0 (enforced by Bandit)
- **Type Coverage**: 100% (enforced by MyPy)
- **Code Style**: Black formatted (PEP 8)
- **Max Line Length**: 120 characters

### JavaScript Frontend
- **Test Coverage**: Minimum 85%
- **ESLint Warnings**: 0 (max-warnings 0)
- **Security Vulnerabilities**: 0
- **Console.log Usage**: 0 (forbidden)
- **Code Complexity**: Maintainability index > 70

## 🚨 Common Issues & Solutions

### Python Issues

1. **Import Order**
   ```bash
   # Fix with Ruff
   ruff check --fix --select I .
   ```

2. **Type Annotations Missing**
   ```bash
   # Find missing types
   mypy . --disallow-untyped-defs
   ```

3. **Security Issues**
   ```bash
   # Get detailed explanations
   bandit -r . -f txt -ll
   ```

### JavaScript Issues

1. **Console.log Violations**
   ```bash
   # Find all console statements
   grep -r "console\." js/
   
   # Replace with structured logging
   # Use logger.info() instead
   ```

2. **Unsafe innerHTML**
   ```bash
   # Find unsafe usage
   grep -r "innerHTML" js/
   
   # Must use DOMPurify.sanitize()
   ```

3. **Missing JSDoc**
   ```bash
   # ESLint will flag these
   npx eslint js/**/*.js --rule 'jsdoc/require-jsdoc: error'
   ```

## 🔄 Continuous Integration

### GitHub Actions Workflow
```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  python-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Black
        run: black --check backend
      - name: Run Ruff
        run: ruff check backend
      - name: Run Bandit
        run: bandit -r backend
      - name: Run Tests
        run: cd backend && pytest --cov

  javascript-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run ESLint
        run: cd frontend && npm run lint
      - name: Run Tests
        run: cd frontend && npm test
```

## 📈 Monitoring Code Quality

### Generate Reports
```bash
# Python coverage trend
cd backend
pytest --cov --cov-report=json
# Track coverage.json over time

# JavaScript complexity trend
cd frontend
npm run quality
# Track reports/plato/summary.json
```

### Key Metrics to Track
1. Test coverage percentage
2. Number of linting violations
3. Security vulnerabilities count
4. Code complexity scores
5. Technical debt ratio

## 🎯 Best Practices

1. **Run checks before committing**
   ```bash
   # Backend
   cd backend && black . && ruff check . && pytest
   
   # Frontend
   cd frontend && npm run check
   ```

2. **Fix issues immediately**
   - Don't accumulate technical debt
   - Address security issues first
   - Maintain high test coverage

3. **Use automation**
   - Pre-commit hooks catch issues early
   - CI/CD enforces standards
   - Regular dependency updates

4. **Document exemptions**
   - If you must disable a rule, document why
   - Use inline comments for clarity
   - Review exemptions regularly

## 📚 Additional Resources

- [Black Documentation](https://black.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

Last Updated: 2025-08-03
Version: 1.0.0