#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AI Conflict Dashboard (Full HTTPS)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop any existing servers
./stop_app.sh >/dev/null 2>&1

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${RED}❌ mkcert is not installed!${NC}"
    echo "Please install mkcert first:"
    echo "  brew install mkcert"
    echo "  mkcert -install"
    exit 1
fi

# Check for backend certificates
if [ ! -f "backend/localhost+2.pem" ] || [ ! -f "backend/localhost+2-key.pem" ]; then
    echo -e "${YELLOW}⚠️  Backend certificates not found, generating...${NC}"
    cd backend
    mkcert localhost 127.0.0.1 ::1
    cd ..
fi

# Check for frontend certificates
if [ ! -f "frontend/localhost+2.pem" ] || [ ! -f "frontend/localhost+2-key.pem" ]; then
    echo -e "${YELLOW}⚠️  Frontend certificates not found, generating...${NC}"
    cd frontend
    mkcert localhost 127.0.0.1 ::1
    cd ..
fi

# Start HTTPS backend
echo -e "${BLUE}Starting HTTPS backend server...${NC}"
cd backend
../venv/bin/python https_server.py > ../logs/backend_https.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo -n "Waiting for backend to start..."
for i in {1..30}; do
    if curl -k -s https://localhost:8000/api/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start HTTPS frontend
echo -e "${BLUE}Starting HTTPS frontend server...${NC}"
cd ../frontend
python3 https-server.py > ../logs/frontend_https.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo -n "Waiting for frontend to start..."
for i in {1..10}; do
    if curl -k -s https://localhost:3000 >/dev/null 2>&1; then
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
echo -e "${GREEN}🔐 Everything is running with HTTPS!${NC}"
echo ""
echo -e "${GREEN}Frontend URL:${NC} https://localhost:3000"
echo -e "${GREEN}Backend API:${NC} https://localhost:8000"
echo -e "${GREEN}API Docs:${NC} https://localhost:8000/docs"
echo ""

# Check Ollama
if command -v ollama >/dev/null 2>&1 && ollama list >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama is not running${NC}"
fi

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Open browser
echo -e "${BLUE}Opening browser...${NC}"
open https://localhost:3000

# Keep script running
trap "echo -e '\n${RED}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait