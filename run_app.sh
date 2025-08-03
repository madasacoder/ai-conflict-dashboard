#!/bin/bash

echo "🚀 Starting AI Conflict Dashboard..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill any existing processes on the ports
echo "Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd ../frontend
python3 -m http.server 3000 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait a moment for servers to fully start
sleep 2

# Open in browser (using IP to avoid HSTS issues)
echo -e "${GREEN}Opening in browser...${NC}"
open http://127.0.0.1:3000

echo -e "${GREEN}✅ AI Conflict Dashboard is running!${NC}"
echo ""
echo "🌐 RECOMMENDED URLS (avoid localhost HSTS issues):"
echo "Main App: http://127.0.0.1:3000"
echo "Workflow Builder: http://127.0.0.1:3000/workflow-builder.html" 
echo "API Docs: http://127.0.0.1:8000/docs"
echo ""
echo "⚠️  ALTERNATIVE URLS (may have HTTPS upgrade issues):"
echo "Main App: http://localhost:3000"
echo "Workflow Builder: http://localhost:3000/workflow-builder.html"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running and handle cleanup
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait