#!/bin/bash

echo "🚀 Starting HTTPS Development Server"
echo "==================================="

# Check if certificates exist
if [ ! -f "frontend/localhost+2.pem" ] || [ ! -f "frontend/localhost+2-key.pem" ]; then
    echo "❌ Certificates not found!"
    echo ""
    echo "Running setup first..."
    ./setup-https.sh
    
    if [ $? -ne 0 ]; then
        echo "Setup failed. Please install mkcert first."
        exit 1
    fi
fi

# Start the HTTPS server
echo ""
echo "🔐 Starting secure frontend server..."
cd frontend
python3 https-server.py