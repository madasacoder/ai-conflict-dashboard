#!/bin/bash
# Comprehensive Python Code Quality Script for AI Conflict Dashboard Backend

set -e  # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
SUCCESS_COLOR='\033[0;32m'
ERROR_COLOR='\033[0;31m'
NC='\033[0m' # No Color
FAIL_UNDER=90

# --- Helper Functions ---
print_header() {
    echo -e "${SUCCESS_COLOR}=======================================${NC}"
    echo -e "${SUCCESS_COLOR} $1 ${NC}"
    echo -e "${SUCCESS_COLOR}=======================================${NC}"
}

run_check() {
    local name="$1"
    local command="$2"
    local success_msg="$3"
    local failure_msg="$4"

    echo -e "\n1. Running $name..."
    if eval "$command"; then
        echo -e "${SUCCESS_COLOR}✅ $name: $success_msg${NC}"
    else
        echo -e "${ERROR_COLOR}❌ $name: $failure_msg${NC}"
        exit 1
    fi
}

# --- Main Script ---
print_header "Running Python Code Quality Checks..."

# 1. Black (Code Formatting)
run_check "Black (Code Formatting)" \
          "black --check ." \
          "Code is formatted correctly" \
          "Code formatting issues found\n   Run 'black .' to auto-format"

# 2. Ruff (Linting)
run_check "Ruff (Linting)" \
          "ruff check ." \
          "No linting issues found" \
          "Linting issues found\n   Run 'ruff check --fix .' to auto-fix"

# 3. Bandit (Security Scan)
run_check "Bandit (Security Scan)" \
          "bandit -c bandit.yml -r ." \
          "No security issues found" \
          "Security issues found"

# 4. MyPy (Type Checking)
run_check "MyPy (Type Checking)" \
          "mypy ." \
          "Type checking passed" \
          "Type checking failed"

# 5. Pytest (Tests & Coverage)
run_check "Pytest (Tests & Coverage)" \
          "pytest --cov=. --cov-report=term-missing --cov-fail-under=$FAIL_UNDER" \
          "All tests passed and coverage is above $FAIL_UNDER%" \
          "Tests failed or coverage below $FAIL_UNDER%"

# --- Final Summary ---
print_header "✅ All quality checks passed!"
echo "Backend Coverage Report: backend/htmlcov/index.html"
