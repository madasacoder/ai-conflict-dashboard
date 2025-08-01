#!/bin/bash

# Test runner script for AI Conflict Dashboard

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found. Are you in the project root?"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if ! python -m pip show pytest > /dev/null 2>&1; then
    echo "Installing test dependencies..."
    pip install -r backend/requirements.txt
fi

# Run the tests
echo "Running integration tests..."
cd backend
python -m pytest tests/test_api_analyze.py -v

# Report test results
if [ $? -eq 0 ]; then
    echo "✅ All integration tests passed!"
else
    echo "❌ Some tests failed"
    exit 1
fi