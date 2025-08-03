#!/bin/bash

# Simple script to run the AI Conflict Dashboard Desktop App

# Ensure Rust/Cargo is in PATH
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi
export PATH="$HOME/.cargo/bin:$PATH"

echo "🚀 Starting AI Conflict Dashboard Desktop App..."
echo "=============================================="

# Navigate to desktop-app directory
cd /Users/ahmed/src/ai-conflict-dashboard/desktop-app

# Kill any existing processes on our ports
echo "🧹 Cleaning up any existing processes..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true

# Start the backend in the background
echo "🔧 Starting backend API..."
cd backend
source ../venv311/bin/activate
python3 -m uvicorn desktop_main:app --reload --port 8000 > ../../logs/desktop_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend API is running at http://localhost:8000"
else
    echo "❌ Backend failed to start. Check logs/desktop_backend.log"
    exit 1
fi

# Start the frontend
echo "🎨 Starting frontend and Tauri app..."
echo ""
echo "The desktop app will open in a new window."
echo "You can also access it at http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both frontend and backend"
echo ""

# Activate virtual environment and run Tauri
source venv311/bin/activate
npm run tauri:dev

# When user presses Ctrl+C, clean up
echo ""
echo "🛑 Shutting down..."
kill $BACKEND_PID 2>/dev/null || true
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
echo "✅ Shutdown complete"