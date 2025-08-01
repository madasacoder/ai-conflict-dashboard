#!/bin/bash

# AI Conflict Dashboard - One-Click Launcher
# This script starts the backend and opens the frontend automatically

echo "🚀 Starting AI Conflict Dashboard..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing dependencies..."
source venv/bin/activate

# Install requirements if needed
pip install -q fastapi uvicorn aiohttp python-multipart

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running!"
echo ""

# Open frontend in default browser
echo "🌐 Opening dashboard in your browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open frontend/index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open frontend/index.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start frontend/index.html
fi

echo ""
echo "✨ AI Conflict Dashboard is ready!"
echo ""
echo "📝 Instructions:"
echo "1. Add your API keys in the settings section"
echo "2. Enter text to analyze"
echo "3. Click 'Analyze' to compare AI responses"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running and handle cleanup
trap "echo ''; echo '🛑 Shutting down...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM

# Wait for backend process
wait $BACKEND_PID