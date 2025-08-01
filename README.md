
# AI Conflict Dashboard - Phase 0 MVP

Compare responses from multiple AI models side-by-side to get better insights and catch potential issues.

## What It Does

This tool sends your text to multiple AI models (OpenAI and Claude) simultaneously and displays their responses side-by-side. This helps you:
- Spot differences in reasoning
- Identify potential hallucinations
- Get multiple perspectives on complex questions
- Make more informed decisions

## Super Quick Start (For Non-Technical Users)

### One-Click Launch:
- **Mac/Linux**: Double-click `run.sh` (or run `./run.sh` in terminal)
- **Windows**: Double-click `run.bat`

The app will automatically:
1. Install what it needs
2. Start the server
3. Open your browser
4. You just need to add your API keys!

## Manual Start (For Developers)

### 1. Start the Backend

```bash
cd backend
source ../venv/bin/activate  # Activate Python virtual environment
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### 2. Open the Frontend

Simply open `frontend/index.html` in your web browser.

### 3. Add Your API Keys

1. Get your API keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Claude: https://console.anthropic.com/account/keys

2. Enter them in the settings section of the web interface
   - Keys are stored locally in your browser
   - Never sent anywhere except to the respective APIs

### 4. Start Comparing!

Enter any text up to 4000 characters and click "Analyze" to see how different AI models respond.

## Example Use Cases

- **Code Review**: "Review this Python function for potential bugs: [paste code]"
- **Writing Help**: "Improve this email to sound more professional: [paste draft]"
- **Learning**: "Explain quantum computing in simple terms"
- **Decision Making**: "What are the pros and cons of [your scenario]?"

## Current Status: Phase 0 (Proof of Concept)

This is a minimal MVP to validate the core concept. See `docs/ROADMAP.md` for future plans.

## Development

- Backend: FastAPI with async support for parallel API calls
- Frontend: Simple HTML/JS for quick iteration
- APIs: OpenAI GPT-3.5 and Claude 3 Haiku (for cost efficiency)

## Troubleshooting

**"Failed to connect to server"**
- Make sure the backend is running (`uvicorn main:app --reload`)
- Check that you're using http://localhost:8000

**"API error: 401"**
- Check that your API keys are correct
- Ensure you have credits in your OpenAI/Claude accounts

**Responses are slow**
- First requests may take longer as APIs warm up
- Each request has a 30-second timeout

## Next Steps

After using this for a week, evaluate:
1. Does it actually save time?
2. Are the comparisons valuable?
3. What's the most annoying limitation?

If the answer is positive, check out `docs/MVP_TASKS.md` for Phase 1 plans.
