# 🚀 Quick Start - AI Conflict Dashboard

## To Run the App

### Option 1: Using the Script (Recommended)
```bash
./run-app.sh
```

This will:
- Start the backend on http://localhost:8000
- Start the frontend on http://localhost:3000
- Show you all the URLs to access

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source ../venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
python3 -m http.server 3000
```

## Access the Application

Once running, open your browser to:
- **Main App**: http://localhost:3000
- **Workflow Builder**: http://localhost:3000/workflow-builder.html
- **API Documentation**: http://localhost:8000/docs

## To Stop the App

### If using the script:
Press `Ctrl+C` or run:
```bash
./stop-app.sh
```

### If started manually:
Press `Ctrl+C` in each terminal

## Verify Everything is Working

Run the end-to-end test:
```bash
source venv/bin/activate
python test-e2e.py
```

You should see all tests passing:
```
Total: 6/6 tests passed (100.0%)
🎉 All tests passed! The application is working correctly.
```

## Need Help?

- Check `STABILIZATION_SUMMARY.md` for what was fixed
- Check `docs/BUGS.md` for known issues
- Check `DAILY_STATUS.md` for current status

The app is now stable and ready to use!