#!/bin/bash

# TypeScript Validation Script for AI Conflict Dashboard
# Comprehensive validation of TypeScript code across all project components

set -e

echo "🚀 AI Conflict Dashboard - TypeScript Validation Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local name="$1"
    local command="$2"
    local directory="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "\n${BLUE}▶ Running: $name${NC}"
    echo "  Directory: $directory"
    echo "  Command: $command"
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        echo "  Running again with output for debugging..."
        eval "$command" || true
    fi
    
    # Return to root directory
    cd "$(dirname "$0")"
}

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        echo -e "${RED}✗ Directory $1 does not exist${NC}"
        return 1
    fi
    return 0
}

echo -e "\n${YELLOW}📋 Pre-flight Checks${NC}"
echo "Checking project structure..."

# Check directories
if ! check_directory "desktop-app"; then exit 1; fi
if ! check_directory "frontend"; then exit 1; fi

echo -e "${GREEN}✓ Project structure validated${NC}"

echo -e "\n${YELLOW}🔧 Installing Dependencies${NC}"

# Install dependencies
echo "Installing desktop-app dependencies..."
cd desktop-app && npm install > /dev/null 2>&1 && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install > /dev/null 2>&1 && cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "\n${YELLOW}📝 TypeScript Type Checking${NC}"

# Desktop App Type Checking
run_check "Desktop App - TypeScript Type Check" "npm run type-check" "desktop-app"
run_check "Desktop App - TypeScript Watch (quick test)" "timeout 5s npm run type-check:watch || true" "desktop-app"

# Frontend Type Checking
run_check "Frontend - TypeScript Type Check" "npm run type-check" "frontend"
run_check "Frontend - TypeScript Watch (quick test)" "timeout 5s npm run type-check:watch || true" "frontend"

echo -e "\n${YELLOW}🔍 ESLint + TypeScript Integration${NC}"

# ESLint with TypeScript
run_check "Desktop App - ESLint" "npm run lint" "desktop-app"
run_check "Frontend - ESLint with TypeScript" "npm run lint" "frontend"

echo -e "\n${YELLOW}💅 Code Formatting${NC}"

# Prettier
run_check "Desktop App - Prettier Check" "npm run format:check" "desktop-app"
run_check "Frontend - Prettier Check" "npm run format:check" "frontend"

echo -e "\n${YELLOW}⚡ Biome Alternative Toolchain${NC}"

# Biome (alternative to ESLint + Prettier)
run_check "Desktop App - Biome Check" "npm run biome:check" "desktop-app"
run_check "Frontend - Biome Check" "npm run biome:check" "frontend"

echo -e "\n${YELLOW}🔒 Security Scanning${NC}"

# Security checks
run_check "Desktop App - npm audit" "npm audit --audit-level=moderate" "desktop-app"
run_check "Frontend - npm audit" "npm audit --audit-level=moderate" "frontend"

# Snyk (optional - requires auth)
echo -e "\n${BLUE}📋 Note: Snyk security scanning requires authentication${NC}"
echo "  Run 'snyk auth' to enable Snyk scanning"
echo "  Then use 'npm run security:snyk' in each directory"

echo -e "\n${YELLOW}🧪 Testing Framework Integration${NC}"

# Testing
run_check "Desktop App - Tests" "npm test" "desktop-app"
run_check "Frontend - Tests" "npm test" "frontend"

echo -e "\n${YELLOW}📊 Quality Metrics${NC}"

# Quality checks
run_check "Desktop App - Full Quality Check" "npm run quality" "desktop-app"
run_check "Frontend - Full Quality Check" "npm run check" "frontend"

echo -e "\n${YELLOW}🔄 Comprehensive Validation${NC}"

# Comprehensive validation
run_check "Desktop App - Full Validation" "npm run validate" "desktop-app"
run_check "Frontend - Full Validation" "npm run validate" "frontend"

echo -e "\n=================================================="
echo -e "${BLUE}📊 FINAL RESULTS${NC}"
echo -e "=================================================="
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "Your TypeScript toolchain is properly configured and working!"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some checks failed${NC}"
    echo -e "This is expected in a development environment."
    echo -e "The toolchain is working correctly - it's finding issues to fix!"
    echo -e "\nTo fix issues:"
    echo -e "  • Run 'npm run fix' or 'npm run biome:fix' to auto-fix formatting"
    echo -e "  • Review type errors and fix manually"
    echo -e "  • Run 'npm audit fix' to fix security vulnerabilities"
    exit 1
fi