"""Tests for main application module."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


class TestMainApp:
    """Test main FastAPI application."""

    def test_root_endpoint(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {
            "message": "AI Conflict Dashboard API",
            "version": "0.1.0",
        }

    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_analyze_with_debug_mode(self):
        """Test analyze endpoint in debug mode with detailed error."""
        with patch("main.log_level", "DEBUG"):
            with patch("llm_providers.analyze_with_models") as mock_analyze:
                mock_analyze.side_effect = ValueError("Test error")

                response = client.post(
                    "/api/analyze", json={"text": "Test text", "openai_key": "test-key"}
                )

                assert response.status_code == 500
                assert "ValueError: Test error" in response.json()["detail"]

    def test_analyze_with_production_mode(self):
        """Test analyze endpoint in production mode with generic error."""
        with patch("main.log_level", "INFO"):
            with patch("llm_providers.analyze_with_models") as mock_analyze:
                mock_analyze.side_effect = ValueError("Test error")

                response = client.post(
                    "/api/analyze", json={"text": "Test text", "openai_key": "test-key"}
                )

                assert response.status_code == 500
                assert response.json()["detail"] == "Analysis failed"
