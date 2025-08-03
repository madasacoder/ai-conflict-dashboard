# Development Setup Guide

Complete guide for setting up the AI Conflict Dashboard development environment with all toolchain components.

## 📋 Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Python** | 3.11+ | Backend development | [python.org](https://python.org) |
| **Node.js** | 18+ LTS | Frontend tooling | [nodejs.org](https://nodejs.org) |
| **Rust** | 1.70+ | Desktop app | [rustup.rs](https://rustup.rs) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com) |

### Optional but Recommended

| Tool | Purpose | Installation |
|------|---------|--------------|
| **make** | Build automation | macOS: Xcode tools, Linux: build-essential |
| **VSCode** | IDE with extensions | [code.visualstudio.com](https://code.visualstudio.com) |
| **GitHub CLI** | Git workflows | [cli.github.com](https://cli.github.com) |

## 🚀 Quick Setup (Automated)

### One-Command Setup
```bash
# Clone and setup everything
git clone https://github.com/yourusername/ai-conflict-dashboard.git
cd ai-conflict-dashboard
make install
```

This will:
- Install all Python dependencies in virtual environments
- Install all Node.js dependencies
- Set up Rust toolchain
- Install pre-commit hooks
- Configure all tools

## 🔧 Manual Setup (Step by Step)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ai-conflict-dashboard.git
cd ai-conflict-dashboard
```

### 2. Backend Setup (Python)
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('✅ FastAPI installed')"
./venv/bin/ruff --version
./venv/bin/black --version
./venv/bin/mypy --version
./venv/bin/bandit --version

cd ..
```

### 3. Frontend Setup (JavaScript)
```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm run lint --version
npx prettier --version
npx playwright --version

cd ..
```

### 4. Desktop App Setup (Rust)
```bash
cd desktop-app

# Install Node.js dependencies
npm install

# Setup Rust toolchain (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify Rust installation
rustc --version
cargo --version

# Install additional tools
cargo install cargo-audit

# Build Tauri app
cd src-tauri
cargo build

cd ../..
```

### 5. Pre-commit Hooks Setup
```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install hooks
pre-commit install

# Test hooks
pre-commit run --all-files
```

## 🛠️ Development Tools Configuration

### VSCode Extensions (Recommended)

Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "ms-python.python",
    "charliermarsh.ruff",
    "ms-python.black-formatter",
    "ms-python.mypy-type-checker",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "ms-playwright.playwright"
  ]
}
```

### VSCode Settings

Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "python.linting.banditEnabled": true,
  "python.linting.mypyEnabled": true,
  "eslint.workingDirectories": ["frontend"],
  "prettier.configPath": "frontend/.prettierrc",
  "rust-analyzer.cargo.buildScripts.enable": true,
  "files.associations": {
    "*.toml": "toml"
  }
}
```

## 🧪 Verify Installation

### Run All Quality Checks
```bash
# From project root
make quality
```

Expected output:
```
✅ Python linting passed
✅ JavaScript linting passed
✅ Rust linting passed
✅ All formatting checks passed
✅ All tests passed
✅ Security scans passed
```

### Individual Component Tests

#### Backend (Python)
```bash
cd backend
./venv/bin/pytest
./venv/bin/ruff check .
./venv/bin/black . --check
./venv/bin/mypy .
./venv/bin/bandit -r .
```

#### Frontend (JavaScript)
```bash
cd frontend
npm test
npm run lint
npm run format:check
npm run security
npm run test:e2e
```

#### Desktop App (Rust)
```bash
cd desktop-app/src-tauri
cargo test
cargo fmt -- --check
cargo clippy
cargo audit
```

## 🎯 Development Workflow

### Daily Workflow
```bash
# 1. Start development session
git pull origin main
make install  # Update dependencies if needed

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes and test frequently
make lint      # Quick linting check
make test      # Run tests

# 4. Before committing
make quality   # Full quality check

# 5. Commit (pre-commit hooks run automatically)
git add .
git commit -m "feat: add new feature"

# 6. Push and create PR
git push origin feature/my-feature
```

### Hot Reloading Development

#### Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend Development
```bash
cd frontend
python3 -m http.server 8080
# Or use live server in VSCode
```

#### Desktop App Development
```bash
cd desktop-app
npm run tauri dev
```

## 🔧 Troubleshooting

### Common Issues

#### "Python virtual environment not found"
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### "Node modules not found"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### "Rust toolchain issues"
```bash
rustup update
rustup component add rustfmt clippy
```

#### "Pre-commit hooks failing"
```bash
# Update hooks
pre-commit autoupdate

# Clear cache
pre-commit clean

# Reinstall
pre-commit uninstall
pre-commit install
```

#### "Permission denied on scripts"
```bash
chmod +x *.sh
chmod +x scripts/*
```

### Platform-Specific Issues

#### macOS
```bash
# Install Xcode command line tools
xcode-select --install

# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Windows
```bash
# Use Windows Subsystem for Linux (WSL2)
wsl --install

# Or use Git Bash for shell commands
```

#### Linux
```bash
# Install build essentials
sudo apt update
sudo apt install build-essential python3-venv nodejs npm

# Or for CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3 nodejs npm
```

## 🔐 Environment Variables

### Backend Configuration

Create `backend/.env`:
```bash
# Development settings
ENVIRONMENT=development
LOG_LEVEL=DEBUG
DEBUG=True

# API Configuration (optional - for testing)
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
GOOGLE_API_KEY=your-key-here

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Circuit breaker settings
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60
```

### Security Notes
- Never commit `.env` files
- Use environment variables in production
- Rotate API keys regularly
- Use different keys for development/production

## 📚 Additional Resources

### Documentation Links
- [Main README](../README.md) - Project overview
- [TOOLCHAIN.md](../TOOLCHAIN.md) - Detailed toolchain documentation
- [Backend README](../backend/README.md) - Backend-specific guides
- [Frontend README](../frontend/README.md) - Frontend-specific guides
- [Desktop App README](../desktop-app/README.md) - Desktop app guides

### Tool Documentation
- [Ruff](https://docs.astral.sh/ruff/) - Python linting and formatting
- [Black](https://black.readthedocs.io/) - Python code formatting
- [MyPy](https://mypy.readthedocs.io/) - Python type checking
- [ESLint](https://eslint.org/docs/) - JavaScript linting
- [Prettier](https://prettier.io/docs/) - JavaScript formatting
- [Clippy](https://doc.rust-lang.org/clippy/) - Rust linting
- [Pre-commit](https://pre-commit.com/) - Pre-commit hooks

### Community
- [Issues](https://github.com/yourusername/ai-conflict-dashboard/issues) - Bug reports and feature requests
- [Discussions](https://github.com/yourusername/ai-conflict-dashboard/discussions) - Community discussions
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute

## 🎉 You're Ready!

Once setup is complete, you should have:
- ✅ All dependencies installed
- ✅ Development servers running
- ✅ Quality checks passing
- ✅ Pre-commit hooks active
- ✅ IDE configured with extensions

Start developing with confidence knowing your code will meet quality standards!