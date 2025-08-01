#!/bin/bash

# AI Conflict Dashboard - Application Startup Script
# This script starts both frontend and backend with proper logging

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

# Set log files with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKEND_LOG="$LOGS_DIR/backend_${TIMESTAMP}.log"
BACKEND_ERROR_LOG="$LOGS_DIR/backend_error_${TIMESTAMP}.log"
FRONTEND_LOG="$LOGS_DIR/frontend_${TIMESTAMP}.log"
FRONTEND_ERROR_LOG="$LOGS_DIR/frontend_error_${TIMESTAMP}.log"
STARTUP_LOG="$LOGS_DIR/startup_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$STARTUP_LOG"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :"$1" -sTCP:LISTEN -t >/dev/null
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -Pi :"$port" -sTCP:LISTEN -t)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Killing processes on port $port: $pids${NC}"
        kill -9 $pids 2>/dev/null
        sleep 1
    fi
}

# Cleanup function
cleanup() {
    log "Shutting down services..."
    
    # Kill backend if running
    if [ ! -z "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        log "Stopping backend (PID: $BACKEND_PID)"
        kill -TERM "$BACKEND_PID" 2>/dev/null
        sleep 2
        kill -9 "$BACKEND_PID" 2>/dev/null
    fi
    
    # Kill frontend if running
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log "Stopping frontend (PID: $FRONTEND_PID)"
        kill -TERM "$FRONTEND_PID" 2>/dev/null
        sleep 2
        kill -9 "$FRONTEND_PID" 2>/dev/null
    fi
    
    log "Cleanup complete"
    exit 0
}

# Set trap for cleanup on exit
trap cleanup EXIT INT TERM

# Header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AI Conflict Dashboard Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log "Starting AI Conflict Dashboard..."
log "Logs directory: $LOGS_DIR"
log "Startup log: $STARTUP_LOG"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1)
log "Python version: $PYTHON_VERSION"

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version 2>&1)
log "Node.js version: $NODE_VERSION"

# Check if ports are in use
echo -e "${YELLOW}Checking ports...${NC}"
if port_in_use 8000; then
    echo -e "${YELLOW}Port 8000 is in use, attempting to free it...${NC}"
    kill_port 8000
fi

if port_in_use 3000; then
    echo -e "${YELLOW}Port 3000 is in use, attempting to free it...${NC}"
    kill_port 3000
fi

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"
cd "$SCRIPT_DIR/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
echo -e "${YELLOW}Checking backend dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt 2>&1 | tee -a "$BACKEND_ERROR_LOG"

# Check for import errors before starting
echo -e "${YELLOW}Validating imports...${NC}"
python3 -c "
import sys
try:
    import main
    print('✓ Main module imports successfully')
except ImportError as e:
    print(f'✗ Import error: {e}')
    sys.exit(1)
" 2>&1 | tee -a "$STARTUP_LOG"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "${RED}Import validation failed! Check $STARTUP_LOG for details${NC}"
    exit 1
fi

# Start backend
echo -e "${GREEN}Starting backend server...${NC}"
log "Backend log: $BACKEND_LOG"
log "Backend error log: $BACKEND_ERROR_LOG"

# Use uvicorn with proper logging
nohup python3 -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level debug \
    > "$BACKEND_LOG" 2> "$BACKEND_ERROR_LOG" &

BACKEND_PID=$!
log "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# Check if backend started successfully
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${RED}Backend failed to start!${NC}"
    echo -e "${RED}Check logs:${NC}"
    echo -e "${RED}  - $BACKEND_LOG${NC}"
    echo -e "${RED}  - $BACKEND_ERROR_LOG${NC}"
    echo ""
    echo "Last 20 lines of error log:"
    tail -n 20 "$BACKEND_ERROR_LOG"
    exit 1
fi

# Frontend setup
echo -e "${BLUE}Setting up frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install 2>&1 | tee -a "$FRONTEND_ERROR_LOG"
fi

# Start frontend
echo -e "${GREEN}Starting frontend server...${NC}"
log "Frontend log: $FRONTEND_LOG"
log "Frontend error log: $FRONTEND_ERROR_LOG"

# Start simple HTTP server for frontend
nohup python3 -m http.server 3000 \
    > "$FRONTEND_LOG" 2> "$FRONTEND_ERROR_LOG" &

FRONTEND_PID=$!
log "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# Create latest symlinks for easy access
ln -sf "$BACKEND_LOG" "$LOGS_DIR/backend_latest.log"
ln -sf "$BACKEND_ERROR_LOG" "$LOGS_DIR/backend_error_latest.log"
ln -sf "$FRONTEND_LOG" "$LOGS_DIR/frontend_latest.log"
ln -sf "$FRONTEND_ERROR_LOG" "$LOGS_DIR/frontend_error_latest.log"
ln -sf "$STARTUP_LOG" "$LOGS_DIR/startup_latest.log"

# Display status
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Application Started Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Frontend URL: ${NC}http://localhost:3000"
echo -e "${GREEN}Backend API: ${NC}http://localhost:8000"
echo -e "${GREEN}API Docs: ${NC}http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Log files:${NC}"
echo -e "  Backend: $LOGS_DIR/backend_latest.log"
echo -e "  Backend Errors: $LOGS_DIR/backend_error_latest.log"
echo -e "  Frontend: $LOGS_DIR/frontend_latest.log"
echo -e "  Frontend Errors: $LOGS_DIR/frontend_error_latest.log"
echo -e "  Startup: $LOGS_DIR/startup_latest.log"
echo ""
echo -e "${YELLOW}Monitoring logs:${NC}"
echo -e "  tail -f $LOGS_DIR/backend_latest.log"
echo -e "  tail -f $LOGS_DIR/backend_error_latest.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Auto-open browser
echo -e "${BLUE}Opening browser...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000 in your browser"
else
    echo "Please open http://localhost:3000 in your browser"
fi

# Function to check Ollama status
check_ollama() {
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ollama is running${NC}"
        log "Ollama detected at http://localhost:11434"
    else
        echo -e "${YELLOW}⚠ Ollama is not running (optional)${NC}"
        echo -e "${YELLOW}  Start with: ollama serve${NC}"
        log "Ollama not detected (optional service)"
    fi
}

# Check optional services
echo -e "${BLUE}Checking optional services...${NC}"
check_ollama
echo ""

# Keep script running and monitor
while true; do
    # Check if backend is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${RED}Backend crashed! Check error logs.${NC}"
        echo "Last 20 lines of backend error log:"
        tail -n 20 "$BACKEND_ERROR_LOG"
        break
    fi
    
    # Check if frontend is still running
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${RED}Frontend crashed! Check error logs.${NC}"
        echo "Last 20 lines of frontend error log:"
        tail -n 20 "$FRONTEND_ERROR_LOG"
        break
    fi
    
    sleep 5
done

# If we get here, something crashed
echo -e "${RED}Application terminated unexpectedly${NC}"
cleanup