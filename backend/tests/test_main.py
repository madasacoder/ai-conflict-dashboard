"""Tests for main application module."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


class TestMainApp:
    @pytest.fixture
    def client(self):
        """Test client fixture."""
        from main import app
        return TestClient(app)

    """Test main FastAPI application."""

    def test_root_endpoint(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200, "Request should succeed"
        assert response.json() == {
            "message": "AI Conflict Dashboard API",
            "version": "0.1.0",
        }

    def test_health_endpoint(self):
        """Test health check endpoint - Grade B test with proper assertions."""
        # Act
        response = client.get("/api/health")
        
        # Assert - Verify response structure
        assert response.status_code == 200, "Health endpoint should return 200"
        
        data = response.json()
        assert "status" in data, "Response should have status field"
        assert data["status"] == "healthy", "Status should be healthy"
        
        # Check for Ollama information if present
        if "ollama" in data:
            assert isinstance(data["ollama"], dict), "Ollama info should be a dict"
            assert "available" in data["ollama"], "Should indicate Ollama availability"

    def test_analyze_with_debug_mode(self):
        """Test analyze endpoint in debug mode with detailed error."""
        with (
            patch("main.log_level", "DEBUG"),
            patch("llm_providers.analyze_with_models") as mock_analyze,
        ):
            mock_analyze.side_effect = ValueError("Test error")

            response = client.post(
                "/api/analyze", json={"text": "Test text", "openai_key": "test-key"}
            )

            assert response.status_code == 500, "Expected status code 500"
            assert "ValueError: Test error" in response.json()["detail"]

    def test_analyze_with_production_mode(self):
        """Test analyze endpoint in production mode with generic error."""
        with (
            patch("main.log_level", "INFO"),
            patch("llm_providers.analyze_with_models") as mock_analyze,
        ):
            mock_analyze.side_effect = ValueError("Test error")

            response = client.post(
                "/api/analyze", json={"text": "Test text", "openai_key": "test-key"}
            )

            assert response.status_code == 500, "Expected status code 500"
            assert response.json()["detail"] == "Analysis failed"
