#\!/bin/bash

# AI Conflict Dashboard - Stop Script
# This script stops all running services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports used by services
BACKEND_PORT=8000
FRONTEND_PORT=3001

echo -e "${BLUE}Stopping AI Conflict Dashboard services...${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ \! -z "$pids" ]; then
        echo -e "${YELLOW}Stopping $service on port $port (PID: $pids)...${NC}"
        kill -TERM $pids 2>/dev/null || true
        sleep 1
        
        # Force kill if still running
        if lsof -ti:$port >/dev/null 2>&1; then
            kill -9 $pids 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ $service stopped${NC}"
    else
        echo -e "${BLUE}$service not running on port $port${NC}"
    fi
}

# Stop Backend
kill_port $BACKEND_PORT "Backend"

# Stop Frontend
kill_port $FRONTEND_PORT "Frontend"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
echo -e "${BLUE}To restart the application, run:${NC}"
echo -e "  ${YELLOW}./start_app.sh${NC}"
EOF < /dev/null