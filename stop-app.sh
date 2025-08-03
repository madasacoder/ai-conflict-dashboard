#!/bin/bash
# Script to stop the AI Conflict Dashboard

echo "🛑 Stopping AI Conflict Dashboard..."

# Kill backend (uvicorn)
echo "Stopping backend..."
pkill -f "uvicorn main:app" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend was not running"
fi

# Kill frontend (python http.server on port 3000)
echo "Stopping frontend..."
lsof -ti:3000 | xargs kill 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend was not running"
fi

echo ""
echo "✅ All servers stopped"