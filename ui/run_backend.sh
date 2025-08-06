#!/bin/bash
cd /Users/ahmed/src/ai-conflict-dashboard/desktop-app
source venv311/bin/activate
cd backend
python3 -m uvicorn desktop_main:app --reload --port 8000