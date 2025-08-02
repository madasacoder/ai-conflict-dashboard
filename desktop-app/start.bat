@echo off
REM AI Conflict Dashboard - Desktop App Startup Script for Windows

echo AI Conflict Dashboard - Desktop App
echo =====================================

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install it first.
    pause
    exit /b 1
)

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install it first.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Please edit .env and add your API keys!
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing Node dependencies...
    call npm install
)

if not exist venv (
    echo Installing Python dependencies...
    python -m venv venv
    call venv\Scripts\pip install -U pip
    call venv\Scripts\pip install -r requirements.txt
)

REM Create directories
if not exist data mkdir data
if not exist logs mkdir logs

REM Start the application
echo.
echo Starting AI Conflict Dashboard...
echo The desktop app will open in a new window
echo.

call npm run start
pause