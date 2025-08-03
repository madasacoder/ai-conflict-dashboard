"""Investigation tests for BUG-039: Ollama Integration Error."""

import pytest
import requests
from pathlib import Path


class TestOllamaErrorInvestigation:
    """
    Tests to investigate BUG-039: Ollama Integration Error

    User reported seeing Ollama errors but we haven't investigated the root cause.
    These tests will help identify and document the specific issues.
    """

    def test_ollama_provider_module_exists(self):
        """Test that Ollama provider module exists and is importable."""
        ollama_provider_path = Path("plugins/ollama_provider.py")

        assert ollama_provider_path.exists(), "Ollama provider module missing"

        # Try to import (this may reveal syntax errors)
        try:
            import sys

            sys.path.append(str(ollama_provider_path.parent))
            import ollama_provider

            # Check for required classes/functions
            assert hasattr(
                ollama_provider, "OllamaProvider"
            ), "Missing OllamaProvider class"

        except ImportError as e:
            pytest.fail(f"Cannot import ollama_provider: {e}")
        except SyntaxError as e:
            pytest.fail(f"Syntax error in ollama_provider: {e}")

    def test_ollama_configuration_in_main(self):
        """Test that Ollama is properly configured in main application."""
        main_py_path = Path("main.py")

        with open(main_py_path, "r") as f:
            content = f.read()

        # Check for Ollama integration
        ollama_indicators = ["ollama", "OllamaProvider", "plugins.ollama_provider"]

        found_ollama = any(
            indicator in content.lower() for indicator in ollama_indicators
        )

        if not found_ollama:
            pytest.skip(
                "Ollama not integrated in main.py - may not be the source of errors"
            )

        # If Ollama is integrated, check for proper error handling
        assert (
            "try:" in content or "except" in content
        ), "Missing error handling for Ollama integration"

    def test_ollama_service_availability(self):
        """Test if Ollama service is running and accessible."""
        # Common Ollama ports and endpoints
        ollama_endpoints = [
            "http://localhost:11434/api/tags",  # Default Ollama API
            "http://127.0.0.1:11434/api/tags",
            "http://localhost:11434/health",
            "http://127.0.0.1:11434/health",
        ]

        service_available = False
        last_error = None

        for endpoint in ollama_endpoints:
            try:
                response = requests.get(endpoint, timeout=5)
                if response.status_code in [200, 404]:  # 404 is OK for health checks
                    service_available = True
                    break
            except requests.ConnectionError as e:
                last_error = e
                continue
            except requests.Timeout as e:
                last_error = e
                continue

        if not service_available:
            pytest.skip(f"Ollama service not running (last error: {last_error})")

        return True

    def test_ollama_models_available(self):
        """Test if Ollama has models available."""
        if not self.test_ollama_service_availability():
            pytest.skip("Ollama service not available")

        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=10)

            if response.status_code == 200:
                models_data = response.json()
                models = models_data.get("models", [])

                assert len(models) > 0, "No Ollama models installed"

                # Log available models for debugging
                model_names = [model.get("name", "unknown") for model in models]
                print(f"Available Ollama models: {model_names}")

                return model_names
            else:
                pytest.fail(
                    f"Ollama API returned {response.status_code}: {response.text}"
                )

        except requests.RequestException as e:
            pytest.fail(f"Error checking Ollama models: {e}")

    def test_ollama_simple_request(self):
        """Test a simple Ollama request to identify error patterns."""
        if not self.test_ollama_service_availability():
            pytest.skip("Ollama service not available")

        models = self.test_ollama_models_available()
        if not models:
            pytest.skip("No Ollama models available")

        # Try a simple generation request
        test_model = models[0]  # Use first available model

        request_data = {"model": test_model, "prompt": "Hello", "stream": False}

        try:
            response = requests.post(
                "http://localhost:11434/api/generate", json=request_data, timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                assert "response" in result, f"Unexpected response format: {result}"
                print(f"Ollama test successful with model {test_model}")
            else:
                pytest.fail(
                    f"Ollama generation failed: {response.status_code} - {response.text}"
                )

        except requests.RequestException as e:
            pytest.fail(f"Error testing Ollama generation: {e}")

    def test_ollama_error_patterns_in_logs(self):
        """Search for Ollama error patterns in application logs."""
        log_dir = Path("../logs")

        if not log_dir.exists():
            pytest.skip("No logs directory found")

        log_files = list(log_dir.glob("*.log"))
        ollama_errors = []

        for log_file in log_files:
            try:
                with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                # Look for Ollama-related errors
                lines = content.split("\n")
                for line_num, line in enumerate(lines, 1):
                    if "ollama" in line.lower() and (
                        "error" in line.lower() or "fail" in line.lower()
                    ):
                        ollama_errors.append(
                            {
                                "file": log_file.name,
                                "line": line_num,
                                "content": line.strip(),
                            }
                        )

            except Exception as e:
                print(f"Warning: Could not read log file {log_file}: {e}")

        if ollama_errors:
            print(f"\nFound {len(ollama_errors)} Ollama-related errors in logs:")
            for error in ollama_errors[:10]:  # Show first 10
                print(f"  {error['file']}:{error['line']} - {error['content']}")

        # Document findings (don't fail - just collect data)
        return ollama_errors

    def test_ollama_configuration_validation(self):
        """Test Ollama configuration for common issues."""
        # Check if Ollama provider has proper configuration
        try:
            from plugins.ollama_provider import OllamaProvider

            # Try to create provider instance
            provider = OllamaProvider()

            # Check for required methods
            required_methods = ["get_available_models", "generate", "is_available"]
            for method in required_methods:
                assert hasattr(provider, method), f"Missing required method: {method}"

        except ImportError:
            pytest.skip("Cannot import OllamaProvider")
        except Exception as e:
            pytest.fail(f"Error creating OllamaProvider: {e}")

    def test_ollama_integration_with_main_app(self):
        """Test Ollama integration with main application."""
        # Test if backend API supports Ollama
        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=5)
            if response.status_code != 200:
                pytest.skip("Backend not running")

            # Try to get available models (if endpoint exists)
            models_response = requests.get(
                "http://127.0.0.1:8000/api/models", timeout=5
            )
            if models_response.status_code == 200:
                models = models_response.json()
                ollama_models = [m for m in models if "ollama" in m.lower()]

                if ollama_models:
                    print(f"Ollama models available via API: {ollama_models}")
                else:
                    print("No Ollama models found in API response")

        except requests.ConnectionError:
            pytest.skip("Backend not running")

    def test_document_ollama_error_findings(self):
        """Document all Ollama error findings for BUG-039."""
        findings = {
            "service_status": "unknown",
            "models_available": [],
            "error_patterns": [],
            "integration_status": "unknown",
        }

        # Collect all findings
        try:
            if self.test_ollama_service_availability():
                findings["service_status"] = "running"
                findings["models_available"] = self.test_ollama_models_available()
            else:
                findings["service_status"] = "not_running"
        except Exception:
            findings["service_status"] = "error"

        findings["error_patterns"] = self.test_ollama_error_patterns_in_logs()

        # Log summary
        print("\n=== OLLAMA ERROR INVESTIGATION SUMMARY ===")
        print(f"Service Status: {findings['service_status']}")
        print(f"Models Available: {len(findings['models_available'])}")
        print(f"Error Patterns Found: {len(findings['error_patterns'])}")

        # This test always passes but documents findings
        assert True, "Ollama investigation completed"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
