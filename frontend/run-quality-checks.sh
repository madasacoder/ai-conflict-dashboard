#!/bin/bash

# Frontend Code Quality Checks Script
# Run all JavaScript quality checks in sequence

echo "🔍 Running JavaScript Code Quality Checks..."
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
FAILED=0

# 1. ESLint check
echo -e "\n${YELLOW}1. Running ESLint (Linting)...${NC}"
if npm run lint ; then
    echo -e "${GREEN}✅ ESLint: No linting issues (0 warnings)${NC}"
else
    echo -e "${RED}❌ ESLint: Linting issues found${NC}"
    echo "   Run 'npm run lint:fix' to auto-fix"
    FAILED=1
fi

# 2. Prettier formatting check
echo -e "\n${YELLOW}2. Running Prettier (Code Formatting)...${NC}"
if npm run format:check ; then
    echo -e "${GREEN}✅ Prettier: Code formatting is correct${NC}"
else
    echo -e "${RED}❌ Prettier: Code formatting issues found${NC}"
    echo "   Run 'npm run format' to auto-format"
    FAILED=1
fi

# 3. Security audit
echo -e "\n${YELLOW}3. Running Security Checks...${NC}"
# Check for high/critical vulnerabilities only
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null)
HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | jq '.metadata.vulnerabilities.high // 0')
CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | jq '.metadata.vulnerabilities.critical // 0')

if [ "$HIGH_VULNS" -eq 0 ] && [ "$CRITICAL_VULNS" -eq 0 ]; then
    echo -e "${GREEN}✅ Security: No high/critical vulnerabilities${NC}"
else
    npm audit
    echo -e "${RED}❌ Security: Found $HIGH_VULNS high and $CRITICAL_VULNS critical vulnerabilities${NC}"
    echo "   Run 'npm audit fix' to fix"
    FAILED=1
fi

# 4. Check for console.log statements
echo -e "\n${YELLOW}4. Checking for console.log statements...${NC}"
CONSOLE_COUNT=$(grep -r "console\." js/ --exclude-dir=node_modules | grep -v "logger" | wc -l)
if [ "$CONSOLE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Console Check: No console.log statements found${NC}"
else
    echo -e "${RED}❌ Console Check: Found $CONSOLE_COUNT console statements${NC}"
    grep -r "console\." js/ --exclude-dir=node_modules | grep -v "logger" | head -5
    echo "   Replace with structured logging (logger.info())"
    FAILED=1
fi

# 5. Check for unsafe innerHTML
echo -e "\n${YELLOW}5. Checking for unsafe innerHTML usage...${NC}"
UNSAFE_HTML=$(grep -r "innerHTML\s*=" js/ --exclude-dir=node_modules | grep -v "DOMPurify.sanitize" | wc -l)
if [ "$UNSAFE_HTML" -eq 0 ]; then
    echo -e "${GREEN}✅ XSS Check: No unsafe innerHTML usage${NC}"
else
    echo -e "${RED}❌ XSS Check: Found $UNSAFE_HTML unsafe innerHTML assignments${NC}"
    grep -r "innerHTML\s*=" js/ --exclude-dir=node_modules | grep -v "DOMPurify.sanitize" | head -5
    echo "   Must use DOMPurify.sanitize()"
    FAILED=1
fi

# 6. Run tests with coverage
echo -e "\n${YELLOW}6. Running Tests with Coverage...${NC}"
if npm run test:coverage -- --run ; then
    echo -e "${GREEN}✅ Tests: All tests passed${NC}"
    # Extract coverage percentage
    echo "   Coverage report generated in coverage/"
else
    echo -e "${RED}❌ Tests: Some tests failed${NC}"
    FAILED=1
fi

# 7. Code complexity analysis
echo -e "\n${YELLOW}7. Generating Code Complexity Report...${NC}"
if npm run quality ; then
    echo -e "${GREEN}✅ Plato: Complexity report generated${NC}"
    echo "   View report at reports/plato/index.html"
else
    echo -e "${YELLOW}⚠️  Plato: Could not generate complexity report${NC}"
fi

# Summary
echo -e "\n==========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All quality checks passed!${NC}"
    echo -e "\nNext steps:"
    echo "  - Review coverage report: open coverage/index.html"
    echo "  - Review complexity report: open reports/plato/index.html"
    exit 0
else
    echo -e "${RED}❌ Some quality checks failed!${NC}"
    echo -e "Please fix the issues before committing."
    exit 1
fi