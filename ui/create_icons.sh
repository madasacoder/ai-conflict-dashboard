#!/bin/bash

# Create icons directory
mkdir -p src-tauri/icons

# Create a simple icon using base64 encoded PNG
# This is a 1x1 transparent PNG
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > src-tauri/icons/icon.png

# Copy to required icon sizes
cp src-tauri/icons/icon.png src-tauri/icons/32x32.png
cp src-tauri/icons/icon.png src-tauri/icons/128x128.png
cp src-tauri/icons/icon.png src-tauri/icons/128x128@2x.png
cp src-tauri/icons/icon.png src-tauri/icons/icon.icns
cp src-tauri/icons/icon.png src-tauri/icons/icon.ico

echo "✅ Created placeholder icons"