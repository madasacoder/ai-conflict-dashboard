#!/bin/bash

# AI Conflict Dashboard - Desktop App Startup Script
# One-click startup for development

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
check_command python3
check_command npm

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

if [ ! -d "venv" ]; then
    echo "📦 Installing Python dependencies..."
    python3 -m venv venv
    ./venv/bin/pip install -U pip
    ./venv/bin/pip install -r requirements.txt
fi

# Create data directory if needed
mkdir -p data logs

# Start the application
echo ""
echo "✅ Starting AI Conflict Dashboard..."
echo "📱 The desktop app will open in a new window"
echo ""

# For desktop app, use Tauri
echo "Starting as desktop app with Tauri..."
npm run tauri:dev