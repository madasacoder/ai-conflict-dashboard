#!/bin/bash

# 🚨 GRADE A CRITICAL BUG REGRESSION TEST RUNNER
# This script runs comprehensive regression tests to ensure critical bugs never reappear

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
UI_DIR="ui"
LOG_FILE="grade_a_regression_test_results.log"
TIMEOUT=300  # 5 minutes per test suite

# Test statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=0

echo -e "${BLUE}🚨 GRADE A CRITICAL BUG REGRESSION TEST SUITE${NC}"
echo -e "${BLUE}==============================================${NC}"
echo "Date: $(date)"
echo "Purpose: Ensure critical bugs never reappear"
echo ""

# Function to log results
log_result() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to run tests with timeout
run_tests_with_timeout() {
    local test_name="$1"
    local test_command="$2"
    local timeout_seconds="$3"
    
    log_result "Running: $test_name"
    log_result "Command: $test_command"
    log_result "Timeout: ${timeout_seconds}s"
    
    if timeout "$timeout_seconds" bash -c "$test_command" 2>&1; then
        log_result "${GREEN}✅ PASSED: $test_name${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        log_result "${RED}❌ FAILED: $test_name${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend if not running
start_backend() {
    if ! check_backend; then
        log_result "${YELLOW}Starting backend server...${NC}"
        cd "$BACKEND_DIR"
        python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!
        cd ..
        
        # Wait for backend to start
        for i in {1..30}; do
            if check_backend; then
                log_result "${GREEN}Backend started successfully${NC}"
                return 0
            fi
            sleep 1
        done
        
        log_result "${RED}Failed to start backend${NC}"
        return 1
    fi
}

# Function to stop backend
stop_backend() {
    if [ ! -z "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
        log_result "${YELLOW}Backend stopped${NC}"
    fi
}

# Cleanup function
cleanup() {
    stop_backend
    log_result ""
    log_result "${BLUE}Test Summary:${NC}"
    log_result "Total Tests: $TOTAL_TESTS"
    log_result "Passed: $PASSED_TESTS"
    log_result "Failed: $FAILED_TESTS"
    log_result "Critical Failures: $CRITICAL_FAILURES"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_result "${GREEN}🎉 ALL CRITICAL BUG REGRESSION TESTS PASSED!${NC}"
        exit 0
    else
        log_result "${RED}💥 CRITICAL BUG REGRESSION TESTS FAILED!${NC}"
        exit 1
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Initialize log file
echo "GRADE A CRITICAL BUG REGRESSION TEST RESULTS" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"

log_result "${BLUE}Starting GRADE A Critical Bug Regression Tests...${NC}"

# 1. Backend Critical Bug Regression Tests
log_result ""
log_result "${BLUE}1. BACKEND CRITICAL BUG REGRESSION TESTS${NC}"
log_result "============================================="

if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_result "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    log_result "${YELLOW}Installing dependencies...${NC}"
    pip install -r requirements.txt
    
    # Start backend for integration tests
    start_backend
    
    # Run critical bug regression tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "BUG-075: Circuit Breaker Regression" \
        "python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestBUG075CircuitBreakerRegression -v" \
        "$TIMEOUT"; then
        log_result "${GREEN}Circuit breaker regression tests passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: Circuit breaker regression tests failed${NC}"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "BUG-086: API Key Exposure Regression" \
        "python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestBUG086APIKeyExposureRegression -v" \
        "$TIMEOUT"; then
        log_result "${GREEN}API key exposure regression tests passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: API key exposure regression tests failed${NC}"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "BUG-108: Data Leakage Regression" \
        "python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestBUG108DataLeakageRegression -v" \
        "$TIMEOUT"; then
        log_result "${GREEN}Data leakage regression tests passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: Data leakage regression tests failed${NC}"
    fi
    
    # Run comprehensive regression suite
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "Comprehensive Critical Bug Regression Suite" \
        "python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestComprehensiveRegressionSuite -v" \
        "$TIMEOUT"; then
        log_result "${GREEN}Comprehensive regression suite passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: Comprehensive regression suite failed${NC}"
    fi
    
    cd ..
else
    log_result "${RED}Backend directory not found${NC}"
    ((CRITICAL_FAILURES++))
fi

# 2. Frontend Critical Bug Regression Tests
log_result ""
log_result "${BLUE}2. FRONTEND CRITICAL BUG REGRESSION TESTS${NC}"
log_result "============================================="

if [ -d "$UI_DIR" ]; then
    cd "$UI_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_result "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Run critical bug regression tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "BUG-081: React Flow Instance Regression" \
        "npm test -- src/__tests__/e2e/CriticalBugRegressionTests.test.tsx --testNamePattern='BUG-081.*React Flow Instance' --run" \
        "$TIMEOUT"; then
        log_result "${GREEN}React Flow instance regression tests passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: React Flow instance regression tests failed${NC}"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "BUG-082: Drag and Drop Regression" \
        "npm test -- src/__tests__/e2e/CriticalBugRegressionTests.test.tsx --testNamePattern='BUG-082.*Drag and Drop' --run" \
        "$TIMEOUT"; then
        log_result "${GREEN}Drag and drop regression tests passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: Drag and drop regression tests failed${NC}"
    fi
    
    # Run comprehensive frontend regression suite
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_tests_with_timeout \
        "Frontend Comprehensive Critical Bug Regression Suite" \
        "npm test -- src/__tests__/e2e/CriticalBugRegressionTests.test.tsx --testNamePattern='Comprehensive Regression Test Suite' --run" \
        "$TIMEOUT"; then
        log_result "${GREEN}Frontend comprehensive regression suite passed${NC}"
    else
        ((CRITICAL_FAILURES++))
        log_result "${RED}CRITICAL: Frontend comprehensive regression suite failed${NC}"
    fi
    
    cd ..
else
    log_result "${RED}UI directory not found${NC}"
    ((CRITICAL_FAILURES++))
fi

# 3. Integration Tests
log_result ""
log_result "${BLUE}3. INTEGRATION CRITICAL BUG REGRESSION TESTS${NC}"
log_result "=================================================="

# Ensure backend is running for integration tests
if ! check_backend; then
    start_backend
fi

# Run real E2E tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_tests_with_timeout \
    "Real E2E Critical Bug Regression Tests" \
    "cd $UI_DIR && npm test -- src/__tests__/e2e/RealE2ETests.test.tsx --run" \
    "$TIMEOUT"; then
    log_result "${GREEN}Real E2E regression tests passed${NC}"
else
    ((CRITICAL_FAILURES++))
    log_result "${RED}CRITICAL: Real E2E regression tests failed${NC}"
fi

# 4. Security Tests
log_result ""
log_result "${BLUE}4. SECURITY CRITICAL BUG REGRESSION TESTS${NC}"
log_result "==============================================="

# Run security-specific tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_tests_with_timeout \
    "Security Baseline Regression Tests" \
    "cd $BACKEND_DIR && source venv/bin/activate && python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestComprehensiveRegressionSuite::test_security_baseline -v" \
    "$TIMEOUT"; then
    log_result "${GREEN}Security baseline regression tests passed${NC}"
else
    ((CRITICAL_FAILURES++))
    log_result "${RED}CRITICAL: Security baseline regression tests failed${NC}"
fi

# 5. Performance Tests
log_result ""
log_result "${BLUE}5. PERFORMANCE CRITICAL BUG REGRESSION TESTS${NC}"
log_result "=================================================="

# Run performance regression tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_tests_with_timeout \
    "Performance Baseline Regression Tests" \
    "cd $BACKEND_DIR && source venv/bin/activate && python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestComprehensiveRegressionSuite::test_performance_baseline -v" \
    "$TIMEOUT"; then
    log_result "${GREEN}Performance baseline regression tests passed${NC}"
else
    ((CRITICAL_FAILURES++))
    log_result "${RED}CRITICAL: Performance baseline regression tests failed${NC}"
fi

# 6. Memory Leak Tests
log_result ""
log_result "${BLUE}6. MEMORY LEAK CRITICAL BUG REGRESSION TESTS${NC}"
log_result "=================================================="

# Run memory leak regression tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_tests_with_timeout \
    "Memory Leak Regression Tests" \
    "cd $BACKEND_DIR && source venv/bin/activate && python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestBUG110MemoryLeakRegression -v" \
    "$TIMEOUT"; then
    log_result "${GREEN}Memory leak regression tests passed${NC}"
else
    ((CRITICAL_FAILURES++))
    log_result "${RED}CRITICAL: Memory leak regression tests failed${NC}"
fi

# 7. Zero Tolerance Policy Verification
log_result ""
log_result "${BLUE}7. ZERO TOLERANCE POLICY VERIFICATION${NC}"
log_result "============================================="

# Verify that all critical bugs have regression tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_tests_with_timeout \
    "Zero Tolerance Policy Tests" \
    "cd $BACKEND_DIR && source venv/bin/activate && python -m pytest tests/test_critical_bug_regression.py::TestCriticalBugRegression::TestComprehensiveRegressionSuite::test_zero_tolerance_policy -v" \
    "$TIMEOUT"; then
    log_result "${GREEN}Zero tolerance policy verification passed${NC}"
else
    ((CRITICAL_FAILURES++))
    log_result "${RED}CRITICAL: Zero tolerance policy verification failed${NC}"
fi

# Final summary
log_result ""
log_result "${BLUE}GRADE A CRITICAL BUG REGRESSION TEST SUMMARY${NC}"
log_result "================================================"
log_result "Total Test Suites: $TOTAL_TESTS"
log_result "Passed: $PASSED_TESTS"
log_result "Failed: $FAILED_TESTS"
log_result "Critical Failures: $CRITICAL_FAILURES"
log_result "Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"

if [ $CRITICAL_FAILURES -eq 0 ]; then
    log_result ""
    log_result "${GREEN}🎉 ALL CRITICAL BUGS ARE PREVENTED FROM REAPPEARING!${NC}"
    log_result "${GREEN}✅ Zero tolerance policy enforced successfully${NC}"
    log_result "${GREEN}✅ GRADE A regression test suite completed successfully${NC}"
else
    log_result ""
    log_result "${RED}💥 CRITICAL BUGS MAY REAPPEAR!${NC}"
    log_result "${RED}❌ Zero tolerance policy violated${NC}"
    log_result "${RED}❌ GRADE A regression test suite failed${NC}"
    log_result ""
    log_result "${YELLOW}Immediate action required:${NC}"
    log_result "1. Review failed tests in $LOG_FILE"
    log_result "2. Fix the critical bugs immediately"
    log_result "3. Re-run the regression test suite"
    log_result "4. Do not deploy until all tests pass"
fi

log_result ""
log_result "Detailed results saved to: $LOG_FILE"
log_result "Test completed at: $(date)"

# Exit with appropriate code
if [ $CRITICAL_FAILURES -eq 0 ]; then
    exit 0
else
    exit 1
fi 