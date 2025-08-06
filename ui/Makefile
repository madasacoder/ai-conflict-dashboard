.PHONY: help install install-python install-node run dev test build clean lint format setup

# Default target
help:
	@echo "AI Conflict Dashboard - Desktop App"
	@echo "=================================="
	@echo "Available commands:"
	@echo "  make setup       - Complete initial setup"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Run in development mode"
	@echo "  make run         - Run the desktop app"
	@echo "  make test        - Run all tests"
	@echo "  make build       - Build for production"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"

# Complete setup
setup: install-python install-node
	@echo "✅ Setup complete! Run 'make dev' to start developing."

# Install all dependencies
install: install-python install-node

# Install Python dependencies
install-python:
	@echo "📦 Installing Python dependencies..."
	@python3 -m venv venv
	@./venv/bin/pip install -U pip
	@./venv/bin/pip install -r requirements.txt
	@echo "✅ Python dependencies installed"

# Install Node dependencies
install-node:
	@echo "📦 Installing Node dependencies..."
	@npm install
	@echo "✅ Node dependencies installed"

# Run in development mode
dev:
	@echo "🚀 Starting development servers..."
	@npm run tauri:dev

# Run the app
run:
	@echo "🚀 Starting AI Conflict Dashboard..."
	@npm run start

# Run all tests
test:
	@echo "🧪 Running tests..."
	@echo "Frontend tests:"
	@npm test
	@echo "\nBackend tests:"
	@./venv/bin/pytest backend/tests -v

# Build for production
build:
	@echo "🏗️  Building for production..."
	@npm run tauri:build

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist build target node_modules venv __pycache__
	@rm -rf backend/__pycache__ backend/tests/__pycache__
	@rm -rf src-tauri/target
	@echo "✅ Clean complete"

# Run linters
lint:
	@echo "🔍 Running linters..."
	@npm run lint
	@./venv/bin/ruff check backend/
	@./venv/bin/mypy backend/

# Format code
format:
	@echo "✨ Formatting code..."
	@npm run format
	@./venv/bin/black backend/
	@./venv/bin/ruff check --fix backend/