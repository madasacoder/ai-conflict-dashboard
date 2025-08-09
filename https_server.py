import os
import sys
from pathlib import Path
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Start the HTTPS server with SSL certificates."""
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    cert_file = script_dir / "localhost+2.pem"
    key_file = script_dir / "localhost+2-key.pem"

    # Check if certificates exist
    if not cert_file or not key_file:
        logger.error("❌ No certificates found! Please run setup-https.sh first.")
        logger.error("   Or generate certificates in the backend directory:")
        logger.error("   cd backend && mkcert localhost 127.0.0.1 ::1")
        exit(1)

    logger.info("🔐 Using certificates:")
    logger.info(f"   Certificate: {cert_file}")
    logger.info(f"   Key: {key_file}")

    # Create SSL context
    ssl_context = (str(cert_file), str(key_file))

    # Run the FastAPI app with HTTPS
    logger.info("\n🚀 Starting HTTPS backend server...")
    logger.info("   URL: https://localhost:8000")
    logger.info("   API Docs: https://localhost:8000/docs")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # noqa: S104
        port=8000,
        ssl_keyfile=key_file,
        ssl_certfile=cert_file,
        reload=True,
    )

if __name__ == "__main__":
    main() 