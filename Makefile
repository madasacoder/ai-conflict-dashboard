# AI Conflict Dashboard - Main Makefile
# Convenience commands for development and quality checks

.PHONY: help install lint format test security quality clean all frontend-install backend-install desktop-install

# Default target
help:
	@echo "AI Conflict Dashboard - Development Commands"
	@echo "==========================================="
	@echo "Installation:"
	@echo "  make install          - Install all dependencies"
	@echo "  make frontend-install - Install frontend dependencies"
	@echo "  make backend-install  - Install backend dependencies"
	@echo "  make desktop-install  - Install desktop app dependencies"
	@echo ""
	@echo "Quality Checks:"
	@echo "  make lint            - Run all linters"
	@echo "  make format          - Run all formatters"
	@echo "  make test            - Run all tests"
	@echo "  make security        - Run security scans"
	@echo "  make quality         - Run all quality checks"
	@echo ""
	@echo "Component-specific:"
	@echo "  make frontend-lint   - Lint frontend code"
	@echo "  make backend-lint    - Lint backend code"
	@echo "  make desktop-lint    - Lint desktop app code"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean generated files"
	@echo "  make pre-commit     - Install pre-commit hooks"

# Installation targets
install: frontend-install backend-install desktop-install pre-commit
	@echo "✅ All dependencies installed"

frontend-install:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

backend-install:
	@echo "📦 Installing backend dependencies..."
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

desktop-install:
	@echo "📦 Installing desktop app dependencies..."
	cd desktop-app && npm install
	@command -v cargo >/dev/null 2>&1 || { echo "❌ Rust/Cargo not installed. Visit https://rustup.rs/"; exit 1; }
	cd desktop-app/src-tauri && cargo build

pre-commit:
	@echo "🔧 Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install
	pre-commit install --hook-type commit-msg

# Linting targets
lint: frontend-lint backend-lint desktop-lint
	@echo "✅ All linting checks passed"

frontend-lint:
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint

backend-lint:
	@echo "🔍 Linting backend..."
	cd backend && ./venv/bin/ruff check .
	cd backend && ./venv/bin/mypy .

desktop-lint:
	@echo "🔍 Linting desktop app..."
	cd desktop-app/src-tauri && cargo clippy -- -D warnings

# Formatting targets
format: frontend-format backend-format desktop-format
	@echo "✅ All code formatted"

frontend-format:
	@echo "✨ Formatting frontend..."
	cd frontend && npm run format

backend-format:
	@echo "✨ Formatting backend..."
	cd backend && ./venv/bin/black .
	cd backend && ./venv/bin/ruff format .

desktop-format:
	@echo "✨ Formatting desktop app..."
	cd desktop-app/src-tauri && cargo fmt

# Testing targets
test: frontend-test backend-test desktop-test
	@echo "✅ All tests passed"

frontend-test:
	@echo "🧪 Testing frontend..."
	cd frontend && npm test

backend-test:
	@echo "🧪 Testing backend..."
	cd backend && ./venv/bin/pytest

desktop-test:
	@echo "🧪 Testing desktop app..."
	cd desktop-app/src-tauri && cargo test

# Security targets
security: frontend-security backend-security desktop-security
	@echo "✅ All security checks passed"

frontend-security:
	@echo "🔒 Security scan frontend..."
	cd frontend && npm audit
	cd frontend && npm run security

backend-security:
	@echo "🔒 Security scan backend..."
	cd backend && ./venv/bin/bandit -r . -f json -o bandit_report.json
	cd backend && ./venv/bin/bandit -r . -f screen --skip B101 -x "./venv,./tests"

desktop-security:
	@echo "🔒 Security scan desktop app..."
	@command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit
	cd desktop-app/src-tauri && cargo audit

# Quality - run everything
quality: lint format test security
	@echo "✅ All quality checks passed!"
	@echo ""
	@echo "📊 Quality Report Summary:"
	@echo "========================="
	@echo "✓ Linting: Passed"
	@echo "✓ Formatting: Passed"
	@echo "✓ Tests: Passed"
	@echo "✓ Security: Passed"

# Clean targets
clean:
	@echo "🧹 Cleaning generated files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type f -name "coverage.xml" -delete 2>/dev/null || true
	rm -rf frontend/coverage 2>/dev/null || true
	rm -rf desktop-app/src-tauri/target 2>/dev/null || true
	@echo "✅ Clean complete"

# All - install and run quality checks
all: install quality
	@echo "🎉 Full setup and quality check complete!"