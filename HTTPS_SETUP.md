# HTTPS Setup for Safari Compatibility

This document explains how to set up HTTPS for local development to permanently solve Safari's JavaScript loading issues.

## The Problem

Safari has strict security policies that prevent loading local JavaScript files over HTTP, resulting in errors like:
- "Failed to load resource: An SSL error has occurred"
- "Cannot load script... Failed integrity metadata check"

## The Solution: mkcert

We use `mkcert` to create locally-trusted development certificates, allowing HTTPS on localhost.

## Setup Instructions

### 1. Install mkcert

```bash
# macOS (using Homebrew)
brew install mkcert

# Or download directly from:
# https://github.com/FiloSottile/mkcert/releases
```

### 2. Run Setup Script

```bash
# From project root
./setup-https.sh
```

This script will:
- Install a local Certificate Authority
- Generate certificates for localhost and 127.0.0.1
- Add certificates to .gitignore

### 3. Start the Application

#### Option A: HTTPS Server (Recommended)
```bash
# Starts both frontend (HTTPS) and backend
./start_app_https.sh
```

#### Option B: HTTPS Frontend Only
```bash
# Just the frontend with HTTPS
./start-https-server.sh
```

## How It Works

1. **mkcert** creates a local Certificate Authority (CA) on your machine
2. It generates certificates signed by this CA
3. Your browser trusts these certificates for localhost
4. JavaScript files load without security errors

## Files Created

- `frontend/localhost+2.pem` - Certificate file
- `frontend/localhost+2-key.pem` - Private key file

**Note**: These files are in .gitignore and should NOT be committed.

## Browser Access

After starting with HTTPS:
- Frontend: https://localhost:3000
- Also works: https://127.0.0.1:3000
- Backend API: http://localhost:8000 (remains HTTP)

## Troubleshooting

### Certificate Warning
- First time only: Browser may show a certificate warning
- Click "Advanced" → "Proceed to localhost"
- This is normal for self-signed certificates

### mkcert Not Found
```bash
# Install Homebrew first if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install mkcert
brew install mkcert
```

### Port Already in Use
```bash
# Stop existing servers
./stop_app.sh

# Then restart
./start_app_https.sh
```

## Benefits

- ✅ Permanent solution for Safari
- ✅ Works with all browsers
- ✅ No more SSL errors
- ✅ External JavaScript files load properly
- ✅ Secure local development
- ✅ No need for inline scripts

## For CI/CD

In production or CI environments, use proper SSL certificates from a Certificate Authority.