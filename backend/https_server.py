#!/usr/bin/env python3
"""HTTPS server wrapper for the FastAPI backend."""

import ssl
from pathlib import Path

import uvicorn


def find_certificates():
    """Find mkcert certificates in the backend directory."""
    cert_patterns = ["localhost+*.pem", "localhost.pem", "cert.pem"]

    for pattern in cert_patterns:
        certs = list(Path().glob(pattern))
        if certs:
            # Find the certificate file
            cert_file = str(certs[0])
            # Find the corresponding key file
            key_file = cert_file.replace(".pem", "-key.pem")

            if Path(key_file).exists():
                return cert_file, key_file

    return None, None


def create_ssl_context(cert_file, key_file):
    """Create SSL context for HTTPS."""
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(cert_file, key_file)
    return ssl_context


if __name__ == "__main__":
    # Check for certificates
    cert_file, key_file = find_certificates()

    if not cert_file or not key_file:
        print("❌ No certificates found! Please run setup-https.sh first.")
        print("   Or generate certificates in the backend directory:")
        print("   cd backend && mkcert localhost 127.0.0.1 ::1")
        exit(1)

    print("🔐 Using certificates:")
    print(f"   Certificate: {cert_file}")
    print(f"   Key: {key_file}")

    # Create SSL context
    ssl_context = create_ssl_context(cert_file, key_file)

    # Run the FastAPI app with HTTPS
    print("\n🚀 Starting HTTPS backend server...")
    print("   URL: https://localhost:8000")
    print("   API Docs: https://localhost:8000/docs")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile=key_file,
        ssl_certfile=cert_file,
        reload=True,
        log_level="info",
    )
