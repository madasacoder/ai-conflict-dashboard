#!/bin/bash

echo "🔐 Setting up HTTPS for local development (Safari compatibility)"
echo "================================================"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed"
    echo ""
    echo "Please install mkcert first:"
    echo "  brew install mkcert"
    echo ""
    echo "Or download from: https://github.com/FiloSottile/mkcert"
    exit 1
fi

echo "✅ mkcert is installed"

# Install local CA (if not already installed)
echo ""
echo "📜 Installing local Certificate Authority..."
mkcert -install

# Change to frontend directory
cd frontend

# Generate certificates for localhost and 127.0.0.1
echo ""
echo "🔑 Generating certificates..."
mkcert localhost 127.0.0.1 ::1

# Create .gitignore entry for certificates
if ! grep -q "*.pem" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# SSL certificates (local only)" >> .gitignore
    echo "*.pem" >> .gitignore
    echo "✅ Added certificates to .gitignore"
fi

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "Certificates created:"
ls -la *.pem
echo ""
echo "Next step: Run './start-https-server.sh' to start the HTTPS server"