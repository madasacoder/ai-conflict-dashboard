#!/bin/bash
# Script to run the AI Conflict Dashboard

echo "🚀 Starting AI Conflict Dashboard..."
echo "=================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please create it with: python3 -m venv venv"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check ports
check_port 8000
BACKEND_PORT_FREE=$?
check_port 3000
FRONTEND_PORT_FREE=$?

# Start backend
echo ""
echo "1️⃣  Starting Backend (Port 8000)..."
if [ $BACKEND_PORT_FREE -eq 0 ]; then
    cd backend
    source ../venv/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend starting with PID: $BACKEND_PID"
else
    echo "⚠️  Backend already running on port 8000"
fi

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Start frontend
echo ""
echo "2️⃣  Starting Frontend (Port 3000)..."
if [ $FRONTEND_PORT_FREE -eq 0 ]; then
    cd frontend
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
    cd ..
    echo "✅ Frontend starting with PID: $FRONTEND_PID"
else
    echo "⚠️  Frontend already running on port 3000"
fi

# Wait for everything to start
sleep 2

echo ""
echo "=================================="
echo "✅ AI Conflict Dashboard is running!"
echo ""
echo "📱 Access the application at:"
echo "   Main App:        http://localhost:3000"
echo "   Workflow Builder: http://localhost:3000/workflow-builder.html"
echo "   API Docs:        http://localhost:8000/docs"
echo ""
echo "🛑 To stop the servers:"
echo "   Press Ctrl+C or run: ./stop-app.sh"
echo "=================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # Also kill any uvicorn processes
    pkill -f "uvicorn main:app" 2>/dev/null
    echo "✅ Servers stopped"
}

# Set trap to cleanup on Ctrl+C
trap cleanup EXIT

# Keep script running
wait