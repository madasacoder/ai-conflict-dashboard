# MVP Tasks - Phase 0 Only

## Goal
Build the absolute minimum to validate that comparing multiple LLM responses provides value.

## Success Criteria
- [ ] I use this tool instead of copy-pasting between ChatGPT and Claude
- [ ] It saves me at least 5 minutes per use
- [ ] The side-by-side comparison reveals insights I would have missed

---

## Day 1-2: Core Backend Functionality

### Setup FastAPI Server
- [ ] Create `backend/main.py` with basic FastAPI app
- [ ] Add CORS middleware for local development
- [ ] Create `/api/analyze` POST endpoint
- [ ] Add basic request validation (max 4000 chars)

### Implement LLM Integrations
- [ ] Create `backend/llm_providers.py`
- [ ] Implement `call_openai()` function
  - Use OpenAI API (gpt-4 or gpt-3.5-turbo)
  - Handle API errors gracefully
  - Return standardized response format
- [ ] Implement `call_claude()` function  
  - Use Anthropic API (claude-3)
  - Handle API errors gracefully
  - Return standardized response format
- [ ] Add timeout handling (30 seconds max per call)

### Basic Response Processing
- [ ] Create response format: `{model: str, response: str, error: str | null}`
- [ ] Return all responses even if some fail
- [ ] Add request ID for tracking

---

## Day 3-4: Minimal Frontend

### Create Simple UI
- [ ] Create `frontend/index.html` - single file for simplicity
- [ ] Add Bootstrap CSS from CDN for basic styling
- [ ] Create layout:
  - Header: "AI Conflict Dashboard"
  - Input section: Large textarea
  - Submit button
  - Results section: 3 columns (or rows on mobile)

### Implement Core Interactions
- [ ] Add JavaScript for API calls (fetch)
- [ ] Show loading state during API calls
- [ ] Display results in columns:
  - Column 1: Original text (truncated)
  - Column 2: OpenAI response
  - Column 3: Claude response
- [ ] Handle and display errors gracefully

### API Key Management
- [ ] Add settings modal/section
- [ ] Store API keys in localStorage
- [ ] Validate keys are present before sending requests
- [ ] Clear error messages for missing keys

---

## Day 5: Testing & Polish

### Real-World Testing
- [ ] Test with actual use cases:
  - Code review request
  - Document editing
  - Email drafting
  - Technical explanations
- [ ] Fix any critical bugs
- [ ] Ensure responses are readable

### Minimal Polish
- [ ] Add basic loading spinner
- [ ] Improve error messages
- [ ] Add character count to textarea
- [ ] Make UI mobile-responsive
- [ ] Add "Clear" button

### Documentation
- [ ] Write simple README.md:
  - What it does (one paragraph)
  - How to run it locally
  - How to add API keys
  - Example use case

---

## STOP HERE - EVALUATE BEFORE CONTINUING

### Evaluation Questions (After 1 Week of Use)
1. Do I actually use this tool daily?
2. Does it provide insights I wouldn't get otherwise?
3. Is the side-by-side view actually helpful?
4. What's the #1 thing that annoys me?
5. Would I recommend this to a colleague?

### If YES to most → Proceed to Phase 1
### If NO to most → Pivot or stop

---

## Intentionally NOT Doing in Phase 0

These are documented in BACKLOG.md:
- ❌ User authentication
- ❌ Database storage
- ❌ Diff highlighting
- ❌ More than 2 LLMs
- ❌ File upload
- ❌ Export functionality
- ❌ Analytics
- ❌ Deployment
- ❌ Tests
- ❌ Proper error handling
- ❌ Type checking
- ❌ Code organization

Remember: **If it's not essential for validation, it's not in Phase 0.**

---

## Time Tracking

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| FastAPI Setup | 2h | | |
| LLM Integrations | 4h | | |
| Frontend UI | 4h | | |
| API Integration | 2h | | |
| Testing & Polish | 3h | | |
| Documentation | 1h | | |
| **Total** | **16h** | | |

Target: Complete in 1 week of evening work (~2-3h/day)