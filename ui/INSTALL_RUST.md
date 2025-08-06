# Installing Rust for Tauri Desktop App

To run the desktop app with Tauri, you need Rust installed.

## Quick Install

Run this command in your terminal:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the prompts and choose option 1 (default installation).

After installation:
1. Restart your terminal or run: `source $HOME/.cargo/env`
2. Verify installation: `cargo --version`
3. Then you can run the desktop app with option 1

## Alternative: Use Web Mode

If you don't want to install Rust right now, you can use the web mode (option 2) which provides the same functionality in your browser.

The web mode:
- Uses the same React frontend
- Connects to the same backend API
- Has all the same features
- Just runs in a browser tab instead of a native window

## Why Rust?

Tauri uses Rust to create a tiny, fast native wrapper around your web app. Benefits:
- Native desktop app (no browser UI)
- Small download size (<30MB vs 100MB+ for Electron)
- Better performance
- Native OS integration

But the web mode works great too!