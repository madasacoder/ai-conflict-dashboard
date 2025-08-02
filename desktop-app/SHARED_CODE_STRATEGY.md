# Shared Code Strategy

This desktop app maximizes code reuse from the existing web application.

## Architecture

```
ai-conflict-dashboard/
├── backend/                    # Original web backend (shared)
│   ├── llm_providers.py       # ✅ Reused for AI calls
│   ├── token_utils.py         # ✅ Reused for token counting
│   ├── smart_chunking.py      # ✅ Reused for text processing
│   ├── structured_logging.py  # ✅ Reused for logging
│   └── plugins/               # ✅ Reused (Ollama support)
│
└── desktop-app/
    ├── backend/
    │   └── desktop_main.py    # Imports & extends web backend
    └── src/                   # New React frontend

```

## How It Works

1. **desktop_main.py** adds the parent backend to Python path
2. Imports all the battle-tested functions from web backend
3. Wraps them in desktop-specific API endpoints
4. Adds Tauri-specific CORS configuration

## Benefits

- **No Code Duplication**: All LLM logic stays in one place
- **Bug Fixes Apply Everywhere**: Fix once, both apps benefit
- **Consistent Behavior**: Same AI processing in web & desktop
- **Easier Maintenance**: Single source of truth

## What's Shared

### ✅ Fully Reused
- All LLM provider integrations (OpenAI, Claude, Gemini, Grok, Ollama)
- Token counting and text chunking
- Smart chunking (preserves code blocks)
- Circuit breakers and error handling
- Structured logging

### 🔄 Adapted for Desktop
- CORS configuration (added `tauri://localhost`)
- API endpoints (simplified for desktop use)
- Environment variables (desktop-specific .env)

### 🆕 Desktop-Specific
- SQLite integration (coming in Task 1.2)
- Tauri IPC commands
- Local file system access
- Desktop-specific UI (React instead of vanilla JS)

## Future Considerations

When adding new features:
1. Add to `backend/` if it's AI/processing logic
2. Add to `desktop-app/backend/` if it's desktop-specific
3. Keep the separation clean for maximum reuse