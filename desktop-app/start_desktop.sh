#!/bin/bash

# AI Conflict Dashboard - Desktop App Startup Script
echo "🚀 AI Conflict Dashboard - Desktop App"
echo "====================================="

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
check_command node
check_command npm

# Source Rust environment if available
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi

# Check for Python 3
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Error: Python is not installed. Please install Python 3.11+"
    exit 1
fi

echo "✅ Using Python: $PYTHON_CMD"

# Kill any process using port 3001
if lsof -i :3001 &> /dev/null; then
    echo "⚠️  Port 3001 is in use. Killing existing process..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys!"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies..."
    npm install
fi

# Set up Python virtual environment
if [ ! -d "venv311" ]; then
    echo "📦 Creating Python 3.11 virtual environment..."
    python3.11 -m venv venv311
fi

# Activate virtual environment and install dependencies
echo "📦 Activating Python 3.11 environment..."
source venv311/bin/activate
pip install -U pip setuptools wheel
pip install -r requirements.txt || {
    echo "⚠️  Some Python packages failed to install. Trying with older pydantic..."
    pip install "pydantic<2.6" pydantic-settings
    pip install -r requirements.txt --no-deps
}

# Create necessary directories
mkdir -p data logs

# Option 1: Run as Tauri desktop app (recommended)
echo ""
echo "Choose how to run the application:"
echo "1) Desktop App (Tauri) - Recommended"
echo "2) Web Mode (Browser)"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo ""
    echo "✅ Starting in Web Mode..."
    echo "📱 Open http://localhost:3001 in your browser"
    echo ""
    npm run start
else
    echo ""
    echo "✅ Starting Desktop App..."
    echo "📱 The desktop app will open in a new window"
    echo ""
    
    # Check if Tauri CLI is installed
    if ! npm list @tauri-apps/cli &>/dev/null; then
        echo "📦 Installing Tauri CLI..."
        npm install --save-dev @tauri-apps/cli
    fi
    
    npm run tauri:dev
fi