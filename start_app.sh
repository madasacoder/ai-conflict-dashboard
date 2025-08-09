#!/bin/bash

# AI Conflict Dashboard - Complete Application Startup Script
# This script validates and starts all required services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/ui"  # Changed from frontend to ui
BACKEND_PORT=8000
FRONTEND_PORT=3001  # Changed from 3000 to 3001
OLLAMA_PORT=11434

# Log files
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKEND_LOG="$LOGS_DIR/backend_${TIMESTAMP}.log"
FRONTEND_LOG="$LOGS_DIR/frontend_${TIMESTAMP}.log"
STARTUP_LOG="$LOGS_DIR/startup_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$STARTUP_LOG"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠ Killing existing process on port $port (PID: $pids)${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "  Waiting for $service_name"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    log "Shutting down services..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        log "Stopping backend (PID: $BACKEND_PID)"
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log "Stopping frontend (PID: $FRONTEND_PID)"
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Cleanup complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Header
clear
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🚀 AI Conflict Dashboard - Startup Script 🚀        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
log "Starting AI Conflict Dashboard..."

# Step 1: Check Ollama
echo -e "${BLUE}[1/4] Checking Ollama Service...${NC}"
if check_port $OLLAMA_PORT; then
    # Get model count
    MODEL_COUNT=$(curl -s http://localhost:$OLLAMA_PORT/api/tags 2>/dev/null | grep -o '"name"' | wc -l || echo "0")
    echo -e "  ${GREEN}✓ Ollama is running (${MODEL_COUNT} models available)${NC}"
    log "Ollama: Running with $MODEL_COUNT models"
else
    echo -e "  ${YELLOW}⚠ Ollama is not running${NC}"
    echo -e "  ${YELLOW}  To use local models, run: ollama serve${NC}"
    log "Ollama: Not running (optional)"
fi

# Step 2: Check Backend
echo -e "${BLUE}[2/4] Setting up Backend...${NC}"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "  ${RED}✗ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "  ${RED}✗ Python 3 is not installed${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "  ${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check/create virtual environment
if [ -d "venv" ]; then
    echo -e "  ${GREEN}✓ Virtual environment exists${NC}"
elif [ -d "../venv" ]; then
    echo -e "  ${GREEN}✓ Using parent virtual environment${NC}"
    VENV_PATH="../venv"
else
    echo -e "  ${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Check if backend is already running
if check_port $BACKEND_PORT; then
    echo -e "  ${YELLOW}⚠ Backend already running on port $BACKEND_PORT${NC}"
    echo -n "    Restart backend? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        kill_port $BACKEND_PORT
    else
        BACKEND_RUNNING=true
    fi
fi

# Start backend if not running
if [ -z "$BACKEND_RUNNING" ]; then
    echo -e "  ${CYAN}Starting backend server...${NC}"
    
    # Use the virtual environment Python
    if [ -d "venv" ]; then
        PYTHON_CMD="venv/bin/python"
    elif [ -d "../venv" ]; then
        PYTHON_CMD="../venv/bin/python"
    else
        PYTHON_CMD="python3"
    fi
    
    # Start the backend with uvicorn for better reliability
    if [ -d "venv" ]; then
        UVICORN_CMD="venv/bin/uvicorn"
    elif [ -d "../venv" ]; then
        UVICORN_CMD="../venv/bin/uvicorn"
    else
        UVICORN_CMD="uvicorn"
    fi
    
    $UVICORN_CMD main:app --host 0.0.0.0 --port $BACKEND_PORT > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    log "Backend PID: $BACKEND_PID"
    
    # Give it a moment to start
    sleep 2
    
    # Check if process is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "  ${RED}✗ Backend process died immediately${NC}"
        echo -e "  ${RED}  Check log: $BACKEND_LOG${NC}"
        tail -n 20 "$BACKEND_LOG"
        exit 1
    fi
    
    if wait_for_service "http://localhost:$BACKEND_PORT/api/health" "Backend"; then
        echo -e "  ${GREEN}✓ Backend started successfully${NC}"
        
        # Check health status
        HEALTH=$(curl -s http://localhost:$BACKEND_PORT/api/health 2>/dev/null)
        if echo "$HEALTH" | grep -q '"status":"healthy"'; then
            echo -e "  ${GREEN}✓ Backend health check passed${NC}"
        fi
    else
        echo -e "  ${RED}✗ Backend failed to start${NC}"
        echo -e "  ${RED}  Check log: $BACKEND_LOG${NC}"
        tail -n 20 "$BACKEND_LOG"
        exit 1
    fi
fi

# Step 3: Check Frontend
echo -e "${BLUE}[3/4] Setting up Frontend...${NC}"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "  ${RED}✗ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "  ${GREEN}✓ Node.js $NODE_VERSION found${NC}"

# Check/install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}Installing frontend dependencies...${NC}"
    npm install --silent
else
    echo -e "  ${GREEN}✓ Dependencies installed${NC}"
fi

# Check if frontend is already running
if check_port $FRONTEND_PORT; then
    echo -e "  ${YELLOW}⚠ Frontend already running on port $FRONTEND_PORT${NC}"
    echo -n "    Restart frontend? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        kill_port $FRONTEND_PORT
    else
        FRONTEND_RUNNING=true
    fi
fi

# Start frontend if not running
if [ -z "$FRONTEND_RUNNING" ]; then
    echo -e "  ${CYAN}Starting frontend server...${NC}"
    npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    log "Frontend PID: $FRONTEND_PID"
    
    if wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend"; then
        echo -e "  ${GREEN}✓ Frontend started successfully${NC}"
    else
        echo -e "  ${RED}✗ Frontend failed to start${NC}"
        echo -e "  ${RED}  Check log: $FRONTEND_LOG${NC}"
        tail -n 20 "$FRONTEND_LOG"
        exit 1
    fi
fi

# Step 4: Final Status
echo -e "${BLUE}[4/4] Verifying Services...${NC}"

# Create symlinks for easy log access
ln -sf "$BACKEND_LOG" "$LOGS_DIR/backend_latest.log"
ln -sf "$FRONTEND_LOG" "$LOGS_DIR/frontend_latest.log"
ln -sf "$STARTUP_LOG" "$LOGS_DIR/startup_latest.log"

# Display final status
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ✅ All Services Running Successfully!           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Application URLs:${NC}"
echo -e "   Frontend:  ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "   Backend:   ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "   API Docs:  ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"

if check_port $OLLAMA_PORT; then
    echo -e "   Ollama:    ${BLUE}http://localhost:$OLLAMA_PORT${NC}"
fi

echo ""
echo -e "${GREEN}📁 Log Files:${NC}"
echo -e "   Backend:   $LOGS_DIR/backend_latest.log"
echo -e "   Frontend:  $LOGS_DIR/frontend_latest.log"
echo -e "   Startup:   $LOGS_DIR/startup_latest.log"

echo ""
echo -e "${GREEN}📋 Useful Commands:${NC}"
echo -e "   View backend logs:   ${CYAN}tail -f $LOGS_DIR/backend_latest.log${NC}"
echo -e "   View frontend logs:  ${CYAN}tail -f $LOGS_DIR/frontend_latest.log${NC}"
echo -e "   Stop all services:   ${CYAN}./stop_app.sh${NC} or press ${YELLOW}Ctrl+C${NC}"

# Ask to open browser
echo ""
echo -n "🌍 Open application in browser? (y/n): "
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Opening browser...${NC}"
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:$FRONTEND_PORT"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true
    fi
fi

echo ""
echo -e "${GREEN}✨ Application is ready to use!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Monitor services
while true; do
    # Check backend health
    if [ ! -z "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${RED}⚠ Backend stopped unexpectedly!${NC}"
        break
    fi
    
    # Check frontend health
    if [ ! -z "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${RED}⚠ Frontend stopped unexpectedly!${NC}"
        break
    fi
    
    sleep 5
done

# If we get here, something crashed
echo -e "${RED}Application terminated unexpectedly${NC}"
cleanup