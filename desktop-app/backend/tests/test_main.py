"""Tests for the desktop app backend."""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert "message" in data


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["message"] == "All systems operational"


def test_get_models():
    """Test get available models endpoint."""
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    
    providers = data["providers"]
    assert "openai" in providers
    assert "claude" in providers
    assert "gemini" in providers
    assert "grok" in providers
    assert "ollama" in providers
    
    # Check provider structure
    for provider_id, provider_data in providers.items():
        assert "name" in provider_data
        assert "models" in provider_data
        assert "requires_key" in provider_data


def test_analyze_no_models():
    """Test analyze endpoint with no models enabled."""
    response = client.post("/api/analyze", json={
        "text": "Test text",
        "models": {}
    })
    assert response.status_code == 400
    assert "No models enabled" in response.json()["detail"]


def test_analyze_with_models():
    """Test analyze endpoint with models enabled."""
    response = client.post("/api/analyze", json={
        "text": "Test text for analysis",
        "models": {
            "openai": {
                "enabled": True,
                "key": "test-key",
                "model": "gpt-3.5-turbo"
            }
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "metadata" in data
    assert "openai" in data["results"]