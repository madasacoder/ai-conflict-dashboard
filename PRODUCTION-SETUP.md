# 🚀 Production Setup Guide - AI Conflict Dashboard

## ⚠️ IMPORTANT: Avoid HTTPS Upgrade Issues

Modern browsers (Chrome, Firefox, Safari) can automatically upgrade HTTP to HTTPS for `localhost`, causing connection failures. This setup guide prevents these issues.

## 📋 Quick Start (Recommended)

### 1. Use the Start Script
```bash
./run_app.sh
```

The script automatically:
- ✅ Opens `http://127.0.0.1:3000` (avoids localhost HSTS issues)
- ✅ Shows both IP and localhost URLs
- ✅ Handles server cleanup automatically

### 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Backend
cd backend
source venv/bin/activate
python main.py &

# Frontend  
cd frontend
python3 -m http.server 3000 &

# Open browser
open http://127.0.0.1:3000
```

## 🌐 URL Recommendations

### ✅ RECOMMENDED (Always Works)
- **Main App**: `http://127.0.0.1:3000`
- **Workflow Builder**: `http://127.0.0.1:3000/workflow-builder.html`
- **API Docs**: `http://127.0.0.1:8000/docs`

### ⚠️ ALTERNATIVE (May Have Issues)
- **Main App**: `http://localhost:3000`
- **Workflow Builder**: `http://localhost:3000/workflow-builder.html` 
- **API Docs**: `http://localhost:8000/docs`

## 🔧 Troubleshooting HTTPS Upgrade Issues

If you see SSL/TLS errors in logs or browser shows "can't connect":

### Problem: Browser Force-Upgrading HTTP to HTTPS

**Symptoms:**
- Browser tries to connect to `https://localhost:3000` instead of `http://`
- SSL handshake errors in server logs
- "Connection refused" or "Site can't be reached" errors

**Quick Fixes (in order):**

1. **Use IP Address**: `http://127.0.0.1:3000` instead of `localhost`

2. **Clear Browser HSTS Cache:**
   - Chrome: `chrome://net-internals/#hsts`
   - Query domain: `localhost` 
   - Click "Delete domain security policies"
   - Restart browser

3. **Try Incognito Mode:**
   - Press Cmd+Shift+N (Chrome) or Cmd+Shift+P (Firefox)
   - Navigate to `http://localhost:3000`

4. **Disable Browser HTTPS Features:**
   - Chrome: `chrome://flags/#https-first-mode` → Disabled
   - Chrome: `chrome://flags/#https-only-mode-enabled` → Disabled
   - Firefox: `about:preferences#privacy` → Uncheck "HTTPS-Only Mode"

5. **Try Different Browser:**
   - Safari, Firefox, or Chrome if using a different browser

## 🎯 Why This Happens

Modern browsers have aggressive HTTPS upgrade policies:
- **HSTS (HTTP Strict Transport Security)**: Browsers cache policies to always use HTTPS
- **HTTPS-First Mode**: Browser feature that upgrades HTTP to HTTPS
- **Extensions**: HTTPS Everywhere, Privacy Badger can force upgrades

Using `127.0.0.1` bypasses most of these policies since they're typically applied to `localhost` specifically.

## 📱 For End Users / Testers

When sharing this app with others, always provide:

1. **Primary URL**: `http://127.0.0.1:3000`
2. **Backup instructions**: "If you see connection issues, try clearing browser cache or use incognito mode"
3. **Alternative URL**: `http://localhost:3000` (mention it may have browser issues)

## 🔒 Security Note

Using `127.0.0.1` vs `localhost` has no security implications for local development. Both resolve to the same loopback interface. The difference is purely in browser security policy handling.

## 📊 Testing Checklist

Before sharing with others, test:
- [ ] `http://127.0.0.1:3000` works in Chrome
- [ ] `http://127.0.0.1:3000` works in Safari  
- [ ] `http://127.0.0.1:3000` works in Firefox
- [ ] `http://localhost:3000` works (or document if it doesn't)
- [ ] Workflow builder link works from main app
- [ ] All features work via IP address

## 💡 Pro Tips

1. **Bookmark the IP**: Save `http://127.0.0.1:3000` as bookmark
2. **Development**: Use IP addresses in all local development URLs
3. **Documentation**: Always provide IP addresses in setup instructions
4. **CI/CD**: Use IP addresses in automated testing

This prevents HTTPS upgrade issues before they happen!