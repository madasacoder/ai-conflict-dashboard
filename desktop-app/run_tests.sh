#!/bin/bash

echo "🧪 Running Comprehensive Test Suite for Desktop App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure we're in the right directory
cd /Users/ahmed/src/ai-conflict-dashboard/desktop-app

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install missing test dependencies
npm install --save-dev @testing-library/jest-dom@latest

echo ""
echo "🔍 Running all tests with coverage..."
echo ""

# Run tests with coverage
npm run test:coverage -- --run

# Check coverage thresholds
echo ""
echo "📊 Coverage Report:"
echo ""

# Extract coverage percentages
COVERAGE_REPORT=$(npm run test:coverage -- --run 2>&1)

# Parse coverage results
LINES=$(echo "$COVERAGE_REPORT" | grep -E "All files.*\|.*\|.*\|.*\|" | awk '{print $10}')
FUNCTIONS=$(echo "$COVERAGE_REPORT" | grep -E "All files.*\|.*\|.*\|.*\|" | awk '{print $12}')
BRANCHES=$(echo "$COVERAGE_REPORT" | grep -E "All files.*\|.*\|.*\|.*\|" | awk '{print $14}')
STATEMENTS=$(echo "$COVERAGE_REPORT" | grep -E "All files.*\|.*\|.*\|.*\|" | awk '{print $16}')

# Check if we meet 95% threshold
THRESHOLD=95

echo "Lines: $LINES%"
echo "Functions: $FUNCTIONS%"
echo "Branches: $BRANCHES%"
echo "Statements: $STATEMENTS%"

# Run specific test suites
echo ""
echo "🎯 Running Critical MVP Tests..."
npm test src/__tests__/critical/MVP.critical.test.tsx -- --run

echo ""
echo "🔥 Running Edge Case Tests..."
npm test src/__tests__/edge-cases/EdgeCases.test.tsx -- --run

echo ""
echo "🐛 Running Debug Tests..."
npm test src/__tests__/debug/DragDrop.debug.test.tsx -- --run

# Summary
echo ""
echo "📋 Test Summary:"
echo "================"

# Count test results
TOTAL_TESTS=$(npm test -- --run 2>&1 | grep -E "Tests.*total" | awk '{print $2}')
PASSED_TESTS=$(npm test -- --run 2>&1 | grep -E "Tests.*passed" | awk '{print $2}')
FAILED_TESTS=$(npm test -- --run 2>&1 | grep -E "Tests.*failed" | awk '{print $2}')

if [ "$FAILED_TESTS" = "0" ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ $FAILED_TESTS tests failed${NC}"
fi

# Check coverage threshold
if (( $(echo "$LINES < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Coverage below 95% threshold${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Coverage meets 95% threshold${NC}"
fi

echo ""
echo "🔍 Next Steps:"
echo "1. Fix all failing tests"
echo "2. Implement missing features exposed by tests"
echo "3. Add more edge case coverage"
echo "4. Run performance benchmarks"