#!/bin/bash

# Quick development startup script
# This is a simpler version for development use

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p logs

# Kill any existing processes on our ports
echo "Cleaning up old processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
echo "Starting backend..."
cd backend
source venv/bin/activate 2>/dev/null || {
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
}

# Start backend with stderr captured
python3 -m uvicorn main:app --reload --port 8000 \
    > ../logs/backend_dev.log 2> ../logs/backend_dev_error.log &

BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Start frontend
cd ../frontend
python3 -m http.server 3000 \
    > ../logs/frontend_dev.log 2> ../logs/frontend_dev_error.log &

FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "Services started:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend errors: logs/backend_dev_error.log"
echo "  Frontend errors: logs/frontend_dev_error.log"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "Or use: pkill -f uvicorn && pkill -f 'http.server 3000'"