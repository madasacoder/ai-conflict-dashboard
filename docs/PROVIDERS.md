# AI Provider Integration Guide

This document details all supported AI providers in the AI Conflict Dashboard, including API setup, model options, and usage guidelines.

## 🤖 Supported Providers

### 1. OpenAI (GPT Models)

**API Key Setup**: https://platform.openai.com/api-keys

**Available Models**:
- `gpt-3.5-turbo` - Fast and cost-effective (Default)
- `gpt-4` - Most capable, slower and more expensive
- `gpt-4-turbo-preview` - Latest GPT-4 version with improved performance
- `gpt-3.5-turbo-16k` - Extended context window (16K tokens)

**Token Limits**:
- GPT-3.5: 4,096 tokens (16K variant: 16,384 tokens)
- GPT-4: 8,192 tokens
- GPT-4 Turbo: 128,000 tokens

**Best For**:
- General-purpose queries
- Code generation and review
- Complex reasoning tasks
- Creative writing

### 2. Anthropic Claude

**API Key Setup**: https://console.anthropic.com/account/keys

**Available Models**:
- `claude-3-haiku-20240307` - Fast and efficient (Default)
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-opus-20240229` - Most capable Claude model
- `claude-2.1` - Previous generation

**Token Limits**:
- All models: 100,000+ token context window

**Best For**:
- Long document analysis
- Detailed explanations
- Academic and research tasks
- Ethical reasoning

### 3. Google Gemini

**API Key Setup**: https://makersuite.google.com/app/apikey

**Available Models**:
- `gemini-1.5-flash` - Fast and efficient (Default)
- `gemini-1.5-flash-8b` - Ultra-fast, lightweight
- `gemini-1.5-pro` - Most capable with large context
- `gemini-1.0-pro` - Previous generation

**Token Limits**:
- Gemini 1.5 Flash: 1 million tokens
- Gemini 1.5 Pro: 2 million tokens
- Gemini 1.0 Pro: 32,000 tokens

**Best For**:
- Multimodal tasks (when supported)
- Large context analysis
- Scientific and technical queries
- Real-time applications (Flash models)

### 4. xAI Grok

**API Key Setup**: https://console.x.ai

**Available Models**:
- `grok-2-latest` - Most capable version (Default)
- `grok-2-mini` - Faster, more efficient
- `grok-beta` - Experimental features

**Token Limits**:
- Context window: 128,000 tokens

**Best For**:
- Current events and real-time information
- Witty and engaging responses
- Technical analysis with personality
- X/Twitter integration scenarios

## 🔧 Configuration

### Backend Integration

All providers are integrated through the `llm_providers.py` module with:
- Circuit breakers (5 failures → 60s reset)
- Structured logging for all API calls
- Automatic retry logic
- Graceful error handling

### Frontend Setup

1. Enter API keys in the collapsible API Settings section
2. Select preferred model for each provider
3. Keys are stored locally in browser localStorage
4. Model preferences are persisted between sessions

## 📊 Comparison Matrix

| Provider | Speed | Cost | Context Window | Strengths |
|----------|-------|------|----------------|-----------|
| GPT-3.5 | ⚡⚡⚡ | 💰 | 4K-16K | Fast, affordable, reliable |
| GPT-4 | ⚡ | 💰💰💰 | 8K-128K | Most capable reasoning |
| Claude Haiku | ⚡⚡⚡ | 💰 | 100K+ | Fast with large context |
| Claude Opus | ⚡ | 💰💰💰 | 100K+ | Best for complex tasks |
| Gemini Flash | ⚡⚡⚡ | 💰 | 1M | Ultra-fast, huge context |
| Gemini Pro | ⚡⚡ | 💰💰 | 2M | Largest context window |
| Grok 2 | ⚡⚡ | 💰💰 | 128K | Real-time info, personality |

## 🚀 Usage Tips

### Optimal Model Selection

1. **For Speed**: GPT-3.5, Claude Haiku, Gemini Flash
2. **For Quality**: GPT-4, Claude Opus, Gemini Pro
3. **For Large Documents**: Any Claude model, Gemini models
4. **For Code**: GPT-4, Claude Sonnet/Opus
5. **For Creative Tasks**: GPT-4, Grok

### Cost Optimization

- Start with faster/cheaper models (Haiku, GPT-3.5, Flash)
- Use premium models (Opus, GPT-4) only when needed
- Leverage the comparison view to identify when simpler models suffice
- Monitor token usage in the UI

### Error Handling

All providers include:
- Automatic circuit breaker protection
- Clear error messages in the UI
- Fallback to other providers if one fails
- Request retry logic for transient failures

## 🔐 Security

- API keys are never sent to our servers
- Keys are stored locally in your browser
- All API calls are made directly to provider endpoints
- No logging of API keys or sensitive data
- HTTPS encryption for all API communications

## 📈 Future Providers

Planned integrations for Phase 3:
- Cohere Command
- Mistral AI
- Local Llama models
- Hugging Face Inference API
- Amazon Bedrock
- Azure OpenAI Service

---

*Last Updated: January 2025*