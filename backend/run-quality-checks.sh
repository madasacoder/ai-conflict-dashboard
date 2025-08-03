#!/bin/bash

# Backend Code Quality Checks Script
# Run all Python quality checks in sequence

echo "🔍 Running Python Code Quality Checks..."
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
FAILED=0

# 1. Black formatting check
echo -e "\n${YELLOW}1. Running Black (Code Formatting)...${NC}"
if black --check . ; then
    echo -e "${GREEN}✅ Black: Code formatting is correct${NC}"
else
    echo -e "${RED}❌ Black: Code formatting issues found${NC}"
    echo "   Run 'black .' to auto-format"
    FAILED=1
fi

# 2. Ruff linting
echo -e "\n${YELLOW}2. Running Ruff (Linting)...${NC}"
if ruff check . ; then
    echo -e "${GREEN}✅ Ruff: No linting issues${NC}"
else
    echo -e "${RED}❌ Ruff: Linting issues found${NC}"
    echo "   Run 'ruff check --fix .' to auto-fix"
    FAILED=1
fi

# 3. Bandit security scan
echo -e "\n${YELLOW}3. Running Bandit (Security Scan)...${NC}"
if bandit -r . -f json -o /tmp/bandit-report.json 2>/dev/null && [ ! -s /tmp/bandit-report.json ] ; then
    echo -e "${GREEN}✅ Bandit: No security issues${NC}"
else
    bandit -r . -ll
    echo -e "${RED}❌ Bandit: Security issues found${NC}"
    FAILED=1
fi

# 4. MyPy type checking
echo -e "\n${YELLOW}4. Running MyPy (Type Checking)...${NC}"
if mypy . ; then
    echo -e "${GREEN}✅ MyPy: Type checking passed${NC}"
else
    echo -e "${RED}❌ MyPy: Type checking failed${NC}"
    FAILED=1
fi

# 5. Pytest with coverage
echo -e "\n${YELLOW}5. Running Pytest (Tests & Coverage)...${NC}"
if pytest --cov=. --cov-fail-under=90 --cov-report=term-missing ; then
    echo -e "${GREEN}✅ Pytest: All tests passed with >90% coverage${NC}"
else
    echo -e "${RED}❌ Pytest: Tests failed or coverage below 90%${NC}"
    FAILED=1
fi

# Summary
echo -e "\n======================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All quality checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some quality checks failed!${NC}"
    echo -e "Please fix the issues before committing."
    exit 1
fi