#!/bin/bash

echo "🔍 Testing Server Status"
echo "======================="
echo ""

# Test backend
echo -n "Backend (port 8000): "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ WORKING"
    echo "  Response: $(curl -s http://localhost:8000/health)"
else
    echo "❌ NOT RESPONDING"
fi

echo ""

# Test frontend
echo -n "Frontend (port 3000): "
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ WORKING"
    # Test if error-detective.html exists
    if curl -s http://localhost:3000/error-detective.html | grep -q "Error Detective"; then
        echo "  ✅ error-detective.html is accessible"
    else
        echo "  ❌ error-detective.html not found"
    fi
else
    echo "❌ NOT RESPONDING"
fi

echo ""
echo "======================="
echo ""
echo "📌 If both show ✅ WORKING, you can directly open:"
echo "   http://localhost:3000/error-detective.html"
echo ""
echo "Current backend processes:"
ps aux | grep uvicorn | grep -v grep | wc -l | xargs echo "  Number of uvicorn processes:"