#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AI Conflict Dashboard (HTTPS)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop any existing servers
./stop_app.sh >/dev/null 2>&1

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
../venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend_https.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo -n "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}⚠️  mkcert not installed, falling back to HTTP${NC}"
    cd ../frontend
    python3 -m http.server 3000 > ../logs/frontend_https.log 2>&1 &
    FRONTEND_PID=$!
    PROTOCOL="http"
else
    # Start HTTPS frontend
    echo -e "${BLUE}Starting HTTPS frontend server...${NC}"
    cd ../frontend
    
    # Check for certificates
    if [ ! -f "localhost+2.pem" ] || [ ! -f "localhost+2-key.pem" ]; then
        echo "Generating certificates..."
        mkcert -install >/dev/null 2>&1
        mkcert localhost 127.0.0.1 ::1 >/dev/null 2>&1
    fi
    
    python3 https-server.py > ../logs/frontend_https.log 2>&1 &
    FRONTEND_PID=$!
    PROTOCOL="https"
fi

echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo -n "Waiting for frontend to start..."
for i in {1..10}; do
    if curl -k -s ${PROTOCOL}://localhost:3000 >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Application Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Frontend URL:${NC} ${PROTOCOL}://localhost:3000"
echo -e "${GREEN}Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}API Docs:${NC} http://localhost:8000/docs"
echo ""

# Check Ollama
if command -v ollama >/dev/null 2>&1 && ollama list >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
fi

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Open browser
if [ "$PROTOCOL" = "https" ]; then
    echo -e "${BLUE}Opening browser with HTTPS...${NC}"
    open https://localhost:3000
else
    open http://localhost:3000
fi

# Keep script running
trap "echo -e '\n${RED}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait