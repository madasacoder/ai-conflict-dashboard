#!/bin/bash

# Script to stop the AI Conflict Dashboard

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping AI Conflict Dashboard...${NC}"

# Kill uvicorn (backend)
echo -n "Stopping backend... "
pkill -f "uvicorn main:app" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
echo -e "${GREEN}Done${NC}"

# Kill frontend
echo -n "Stopping frontend... "
pkill -f "http.server 3000" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
echo -e "${GREEN}Done${NC}"

# Optional: Kill any python processes in backend directory
echo -n "Cleaning up any remaining processes... "
pkill -f "backend.*python" 2>/dev/null
echo -e "${GREEN}Done${NC}"

echo ""
echo -e "${GREEN}All services stopped${NC}"

# Show any remaining processes on our ports
if lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${RED}Warning: Port 8000 still in use:${NC}"
    lsof -i:8000
fi

if lsof -i:3000 >/dev/null 2>&1; then
    echo -e "${RED}Warning: Port 3000 still in use:${NC}"
    lsof -i:3000
fi