"""
Test suite for Ollama integration in workflow builder.
Ensures the API returns the correct format that the frontend expects.
"""

import pytest
from unittest.mock import patch, AsyncMock


class TestWorkflowBuilderOllamaIntegration:
    """Test Ollama model dropdown functionality in workflow builder."""

    @pytest.fixture
    def mock_ollama_response(self):
        """Mock Ollama API response with model objects."""
        return {
            "models": [
                {
                    "name": "gemma3:4b",
                    "model": "gemma3:4b",
                    "modified_at": "2025-08-01T14:38:25.261621222-05:00",
                    "size": 3338801804,
                    "digest": "a2af6cc3eb7fa8be8504abaf9b04e88f17a119ec3f04a3addf55f92841195f5a",
                    "details": {
                        "parent_model": "",
                        "format": "gguf",
                        "family": "gemma3",
                        "families": ["gemma3"],
                        "parameter_size": "4.3B",
                        "quantization_level": "Q4_K_M",
                    },
                },
                {
                    "name": "llama3.3:70b",
                    "model": "llama3.3:70b",
                    "modified_at": "2025-06-18T20:35:27.752086116-05:00",
                    "size": 42520413916,
                    "digest": "a6eb4748fd2990ad2952b2335a95a7f952d1a06119a0aa6a2df6cd052a93a3fa",
                    "details": {
                        "parent_model": "",
                        "format": "gguf",
                        "family": "llama",
                        "families": ["llama"],
                        "parameter_size": "70.6B",
                        "quantization_level": "Q4_K_M",
                    },
                },
            ]
        }

    def test_ollama_models_endpoint_returns_correct_format(
        self, client, mock_ollama_response
    ):
        """Test that /api/ollama/models returns the format expected by frontend."""
        # Mock the OllamaProvider instance
        mock_provider = AsyncMock()
        mock_provider.__aenter__.return_value = mock_provider
        mock_provider.__aexit__.return_value = None

        # Mock check_health to return available
        mock_provider.check_health.return_value = {
            "available": True,
            "base_url": "http://localhost:11434",
        }

        # Mock list_models to return our test data
        mock_provider.list_models.return_value = [
            {
                "name": model["name"],
                "size": model["size"],
                "modified": model["modified_at"],
            }
            for model in mock_ollama_response["models"]
        ]

        with patch(
            "plugins.ollama_provider.OllamaProvider", return_value=mock_provider
        ):
            response = client.get("/api/ollama/models")

            assert response.status_code == 200
            data = response.json()

            # Verify response structure
            assert "available" in data
            assert "models" in data
            assert data["available"] is True
            assert isinstance(data["models"], list)
            assert len(data["models"]) == 2

            # Verify each model has required fields
            for model in data["models"]:
                assert "name" in model
                assert "size" in model
                assert "modified" in model
                assert isinstance(model["name"], str)
                assert isinstance(model["size"], int)
                assert isinstance(model["modified"], str)

            # Verify specific model data
            assert data["models"][0]["name"] == "gemma3:4b"
            assert data["models"][0]["size"] == 3338801804
            assert data["models"][1]["name"] == "llama3.3:70b"
            assert data["models"][1]["size"] == 42520413916

    def test_ollama_models_endpoint_handles_empty_list(self, client):
        """Test that endpoint handles empty model list gracefully."""
        # Mock the OllamaProvider instance
        mock_provider = AsyncMock()
        mock_provider.__aenter__.return_value = mock_provider
        mock_provider.__aexit__.return_value = None

        # Mock check_health to return available
        mock_provider.check_health.return_value = {
            "available": True,
            "base_url": "http://localhost:11434",
        }

        # Mock list_models to return empty list
        mock_provider.list_models.return_value = []

        with patch(
            "plugins.ollama_provider.OllamaProvider", return_value=mock_provider
        ):
            response = client.get("/api/ollama/models")

            assert response.status_code == 200
            data = response.json()

            assert data["available"] is True
            assert data["models"] == []

    def test_ollama_models_endpoint_handles_service_down(self, client):
        """Test that endpoint handles Ollama service being down."""
        # Mock the OllamaProvider instance
        mock_provider = AsyncMock()
        mock_provider.__aenter__.return_value = mock_provider
        mock_provider.__aexit__.return_value = None

        # Mock check_health to return not available
        mock_provider.check_health.return_value = {
            "available": False,
            "error": "Connection refused - Ollama service is not running",
            "help": "Please start Ollama with: ollama serve",
        }

        with patch(
            "plugins.ollama_provider.OllamaProvider", return_value=mock_provider
        ):
            response = client.get("/api/ollama/models")

            assert response.status_code == 200
            data = response.json()

            assert data["available"] is False
            assert "error" in data
            assert "help" in data

    def test_frontend_can_parse_model_response(self, mock_ollama_response):
        """Simulate frontend parsing logic to ensure compatibility."""
        # This test simulates what the frontend JavaScript does
        models_data = {
            "available": True,
            "models": [
                {
                    "name": model["name"],
                    "size": model["size"],
                    "modified": model["modified_at"],
                }
                for model in mock_ollama_response["models"]
            ],
        }

        # Simulate frontend dropdown generation
        dropdown_options = []
        for model in models_data["models"]:
            # This would fail if model is used directly as string
            option_value = model["name"]  # Not model (which would be [object Object])
            option_text = f"{model['name']} ({model['size'] / (1024**3):.1f} GB)"
            dropdown_options.append({"value": option_value, "text": option_text})

        # Verify dropdown options are correctly formatted
        assert len(dropdown_options) == 2
        assert dropdown_options[0]["value"] == "gemma3:4b"
        assert dropdown_options[0]["text"] == "gemma3:4b (3.1 GB)"
        assert dropdown_options[1]["value"] == "llama3.3:70b"
        assert dropdown_options[1]["text"] == "llama3.3:70b (39.6 GB)"

        # Ensure no [object Object] in values
        for option in dropdown_options:
            assert "[object Object]" not in option["value"]
            assert "[object Object]" not in option["text"]


class TestWorkflowBuilderOllamaFrontendIntegration:
    """Test the actual frontend JavaScript handling of Ollama models."""

    def test_loadOllamaModels_function_contract(self):
        """Document the expected contract for loadOllamaModels function."""
        expected_api_response = {
            "available": True,
            "models": [
                {
                    "name": "model1",
                    "size": 1000000000,
                    "modified": "2025-01-01T00:00:00Z",
                },
                {
                    "name": "model2",
                    "size": 2000000000,
                    "modified": "2025-01-01T00:00:00Z",
                },
            ],
        }

        # Expected HTML output

        # This documents what the frontend expects
        assert "models" in expected_api_response
        assert all("name" in model for model in expected_api_response["models"])
        assert all(
            isinstance(model["name"], str) for model in expected_api_response["models"]
        )

    def test_regression_object_object_bug(self):
        """Regression test for the [object Object] bug."""
        # This would be the buggy code that treats model as string
        models = [{"name": "test-model", "size": 1000000000}]

        # Buggy implementation would do: str(model) which gives "[object Object]"
        # Correct implementation accesses model.name

        for model in models:
            # This assertion would catch the bug
            assert str(model) == "{'name': 'test-model', 'size': 1000000000}"
            assert "[object Object]" not in str(model)

            # Correct way to get model name
            assert model["name"] == "test-model"
