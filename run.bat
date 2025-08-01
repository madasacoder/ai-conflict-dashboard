@echo off
REM AI Conflict Dashboard - One-Click Launcher for Windows

echo Starting AI Conflict Dashboard...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11 or higher from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Installing dependencies...
call venv\Scripts\activate.bat

REM Install minimal requirements
pip install -q fastapi uvicorn aiohttp python-multipart

REM Start backend
echo Starting backend server...
cd backend
start /b uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ..\backend.log 2>&1
cd ..

REM Wait for backend to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Open frontend in browser
echo Opening dashboard in your browser...
start frontend\index.html

echo.
echo AI Conflict Dashboard is ready!
echo.
echo Instructions:
echo 1. Add your API keys in the settings section
echo 2. Enter text to analyze
echo 3. Click 'Analyze' to compare AI responses
echo.
echo Press any key to stop the server...
pause >nul

REM Kill the backend process
taskkill /f /im uvicorn.exe >nul 2>&1