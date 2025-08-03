#!/bin/bash
# Emergency fix for persistent HTTPS upgrade issue

echo "🚨 EMERGENCY FIX: Stop HTTPS Upgrades"
echo "====================================="

echo "1. Checking if backend is running..."
if lsof -ti:8000 > /dev/null; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is NOT running on port 8000"
    echo "   Starting backend..."
    cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    sleep 3
fi

echo "2. Checking if frontend is running..."
if lsof -ti:3000 > /dev/null; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is NOT running on port 3000"
    echo "   Starting frontend..."
    cd frontend && python3 -m http.server 3000 &
    sleep 2
fi

echo "3. Testing with curl (bypasses browser)..."
echo "   Testing: curl -v http://localhost:3000/"
curl -v http://localhost:3000/ 2>&1 | head -10

echo ""
echo "4. Testing backend directly..."
echo "   Testing: curl -v http://localhost:8000/health"
curl -v http://localhost:8000/health 2>&1 | head -10

echo ""
echo "🔍 BROWSER DIAGNOSTICS:"
echo "=============================="
echo "The issue is browser-specific. Try these in order:"
echo ""
echo "OPTION 1: Use different browser"
echo "   - Safari: http://localhost:3000"
echo "   - Firefox: http://localhost:3000"
echo ""
echo "OPTION 2: Use IP address instead of localhost"
echo "   - Try: http://127.0.0.1:3000"
echo "   - Try: http://0.0.0.0:3000"
echo ""
echo "OPTION 3: Clear browser completely"
echo "   - Chrome: chrome://settings/resetAndCleanup"
echo "   - Or quit Chrome and restart"
echo ""
echo "OPTION 4: Use incognito mode"
echo "   - Cmd+Shift+N for incognito"
echo "   - Try: http://localhost:3000"

echo ""
echo "🎯 MOST LIKELY FIX:"
echo "Try http://127.0.0.1:3000 instead of localhost:3000"
echo "This bypasses localhost-specific HSTS policies"