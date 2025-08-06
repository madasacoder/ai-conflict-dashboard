#!/bin/bash

echo "🧪 Testing AI Conflict Dashboard Desktop App"
echo "=========================================="

# Test 1: Check if backend is responding
echo "✅ Test 1: Checking backend health..."
curl -s http://localhost:8000/health || echo "❌ Backend not responding"

# Test 2: Check if frontend is responding  
echo "✅ Test 2: Checking frontend..."
curl -s http://localhost:3001 | grep -q "AI Conflict Dashboard" && echo "✅ Frontend is running" || echo "❌ Frontend not responding"

# Test 3: Check Tauri process
echo "✅ Test 3: Checking Tauri app..."
ps aux | grep -i "ai-conflict-dashboard" | grep -v grep && echo "✅ Tauri app is running" || echo "❌ Tauri app not found"

echo ""
echo "📋 Summary:"
echo "- Backend API: http://localhost:8000"
echo "- Frontend Dev: http://localhost:3001"
echo "- Desktop App: Should be running as a native window"