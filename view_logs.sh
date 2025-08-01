#!/bin/bash

# Script to view application logs

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOGS_DIR="$SCRIPT_DIR/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to display menu
show_menu() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   AI Conflict Dashboard - Log Viewer${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1) View latest backend log"
    echo "2) View latest backend error log"
    echo "3) View latest frontend log"
    echo "4) View latest frontend error log"
    echo "5) View latest startup log"
    echo "6) Tail backend logs (live)"
    echo "7) Tail backend error logs (live)"
    echo "8) List all log files"
    echo "9) Search in logs"
    echo "10) View import errors"
    echo "0) Exit"
    echo ""
}

# Function to search logs
search_logs() {
    echo -n "Enter search term: "
    read search_term
    echo ""
    echo -e "${YELLOW}Searching for '$search_term' in all logs...${NC}"
    echo ""
    grep -n "$search_term" "$LOGS_DIR"/*.log 2>/dev/null | head -50
}

# Function to view import errors
view_import_errors() {
    echo -e "${YELLOW}Searching for import errors...${NC}"
    echo ""
    grep -E "(ModuleNotFoundError|ImportError|No module named)" "$LOGS_DIR"/*.log 2>/dev/null
}

# Main loop
while true; do
    show_menu
    echo -n "Select option: "
    read choice
    
    case $choice in
        1)
            echo -e "${GREEN}Latest backend log:${NC}"
            less "$LOGS_DIR/backend_latest.log" 2>/dev/null || echo "No backend log found"
            ;;
        2)
            echo -e "${RED}Latest backend error log:${NC}"
            less "$LOGS_DIR/backend_error_latest.log" 2>/dev/null || echo "No backend error log found"
            ;;
        3)
            echo -e "${GREEN}Latest frontend log:${NC}"
            less "$LOGS_DIR/frontend_latest.log" 2>/dev/null || echo "No frontend log found"
            ;;
        4)
            echo -e "${RED}Latest frontend error log:${NC}"
            less "$LOGS_DIR/frontend_error_latest.log" 2>/dev/null || echo "No frontend error log found"
            ;;
        5)
            echo -e "${BLUE}Latest startup log:${NC}"
            less "$LOGS_DIR/startup_latest.log" 2>/dev/null || echo "No startup log found"
            ;;
        6)
            echo -e "${GREEN}Tailing backend logs (Ctrl+C to stop):${NC}"
            tail -f "$LOGS_DIR/backend_latest.log" 2>/dev/null || echo "No backend log found"
            ;;
        7)
            echo -e "${RED}Tailing backend error logs (Ctrl+C to stop):${NC}"
            tail -f "$LOGS_DIR/backend_error_latest.log" 2>/dev/null || echo "No backend error log found"
            ;;
        8)
            echo -e "${BLUE}All log files:${NC}"
            ls -la "$LOGS_DIR"/*.log 2>/dev/null || echo "No log files found"
            echo ""
            ;;
        9)
            search_logs
            echo ""
            echo "Press Enter to continue..."
            read
            ;;
        10)
            view_import_errors
            echo ""
            echo "Press Enter to continue..."
            read
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    if [[ $choice =~ ^[1-5]$ ]]; then
        echo ""
        echo "Press Enter to continue..."
        read
    fi
done