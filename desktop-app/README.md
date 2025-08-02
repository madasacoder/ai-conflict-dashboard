# AI Conflict Dashboard - Desktop App

A powerful desktop application for orchestrating multiple AI models with a beautiful visual workflow builder.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- Python 3.11+
- Git

### Setup in 3 Steps

1. **Clone and enter directory**
   ```bash
   cd desktop-app
   ```

2. **Copy environment file and add API keys**
   ```bash
   cp .env.example .env
   # Edit .env and add at least one API key
   ```

3. **Start the app**
   ```bash
   ./start.sh      # Mac/Linux
   start.bat       # Windows
   ```

The app will automatically install dependencies on first run and open in a new window!

## 🛠️ Development

### Available Commands

```bash
make help        # Show all available commands
make setup       # Complete initial setup
make dev         # Run in development mode
make test        # Run all tests
make build       # Build for production
make lint        # Run linters
make format      # Format code
```

### Project Structure

```
desktop-app/
├── src/                    # React frontend code
│   ├── components/         # React components
│   ├── state/             # Zustand stores
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── src-tauri/             # Tauri backend (Rust)
├── backend/               # FastAPI Python backend
│   ├── main.py           # API entry point
│   ├── models/           # Database models
│   ├── api/              # API endpoints
│   └── tests/            # Backend tests
├── public/                # Static assets
└── data/                  # Local SQLite database
```

### Technology Stack

- **Frontend**: React 18, React Flow, Zustand, Tailwind CSS
- **Desktop**: Tauri (Rust-based, uses OS webview)
- **Backend**: FastAPI (Python), SQLite
- **Testing**: Vitest (frontend), Pytest (backend)

## 🎯 Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating AI workflows
- **Multi-Model Support**: OpenAI, Claude, Gemini, Grok, and Ollama (local)
- **Offline Mode**: Works without internet using Ollama
- **Cost Tracking**: Real-time cost monitoring and optimization
- **Beautiful UI**: Modern, responsive design with dark mode
- **Fast & Lightweight**: <30MB download, native performance

## 🧪 Testing

```bash
# Run all tests
make test

# Frontend tests only
npm test

# Backend tests only
./venv/bin/pytest

# Test coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build the desktop app
make build

# Output will be in:
# - src-tauri/target/release/bundle/
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Contributing Guide](docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details