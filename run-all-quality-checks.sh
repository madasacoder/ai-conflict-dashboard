#!/bin/bash

# Master Code Quality Checks Script
# Runs quality checks for both backend and frontend

echo "🚀 AI Conflict Dashboard - Full Code Quality Check"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
BACKEND_FAILED=0
FRONTEND_FAILED=0

# Run backend checks
echo -e "${BLUE}🐍 BACKEND (Python) Quality Checks${NC}"
echo "=================================="
cd backend
if ./run-quality-checks.sh ; then
    BACKEND_STATUS="${GREEN}✅ PASSED${NC}"
else
    BACKEND_STATUS="${RED}❌ FAILED${NC}"
    BACKEND_FAILED=1
fi
cd ..

echo ""
echo ""

# Run frontend checks
echo -e "${BLUE}🌐 FRONTEND (JavaScript) Quality Checks${NC}"
echo "======================================"
cd frontend
if ./run-quality-checks.sh ; then
    FRONTEND_STATUS="${GREEN}✅ PASSED${NC}"
else
    FRONTEND_STATUS="${RED}❌ FAILED${NC}"
    FRONTEND_FAILED=1
fi
cd ..

# Overall summary
echo ""
echo ""
echo "=================================================="
echo -e "${YELLOW}📊 QUALITY CHECK SUMMARY${NC}"
echo "=================================================="
echo -e "Backend (Python):     $BACKEND_STATUS"
echo -e "Frontend (JavaScript): $FRONTEND_STATUS"
echo ""

# Additional metrics if available
if [ -f "backend/htmlcov/index.html" ]; then
    echo "📈 Backend Coverage Report: backend/htmlcov/index.html"
fi
if [ -f "frontend/coverage/index.html" ]; then
    echo "📈 Frontend Coverage Report: frontend/coverage/index.html"
fi
if [ -f "frontend/reports/plato/index.html" ]; then
    echo "📊 Code Complexity Report: frontend/reports/plato/index.html"
fi

echo "=================================================="

# Exit with appropriate code
if [ $BACKEND_FAILED -eq 0 ] && [ $FRONTEND_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL QUALITY CHECKS PASSED!${NC}"
    echo ""
    echo "Your code meets all quality standards and is ready for commit."
    exit 0
else
    echo -e "${RED}❌ SOME QUALITY CHECKS FAILED!${NC}"
    echo ""
    echo "Please review and fix the issues above before committing."
    echo ""
    echo "Quick fixes:"
    echo "  - Python formatting: cd backend && black ."
    echo "  - Python linting: cd backend && ruff check --fix ."
    echo "  - JS formatting: cd frontend && npm run format"
    echo "  - JS linting: cd frontend && npm run lint:fix"
    exit 1
fi