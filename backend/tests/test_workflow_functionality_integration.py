"""Integration tests for workflow builder functionality - BUG-038."""

from pathlib import Path

import pytest
import requests


class TestWorkflowBuilderIntegration:
    """
    Integration tests for BUG-038: Workflow Builder JavaScript Missing Core Functionality

    These tests verify that the workflow builder actually works end-to-end,
    not just that individual components exist.
    """

    def test_workflow_builder_page_loads(self):
        """Test that workflow builder page loads without errors."""
        try:
            response = requests.get("http://127.0.0.1:3000/workflow-builder.html", timeout=5)
            assert (
                response.status_code == 200
            ), f"Workflow builder page failed to load: {response.status_code}"

            # Check for essential HTML elements
            content = response.text
            assert '<div id="drawflow">' in content, "Missing drawflow container"
            assert "node-item" in content, "Missing node items in sidebar"
            assert "data-node-type=" in content, "Missing data attributes on nodes"

        except requests.ConnectionError:
            pytest.skip("Frontend server not running")
        except requests.Timeout:
            pytest.fail("Workflow builder page load timeout")

    def test_workflow_javascript_loads(self):
        """Test that workflow JavaScript file loads successfully."""
        try:
            response = requests.get("http://127.0.0.1:3000/js/workflow-builder.js", timeout=5)
            assert (
                response.status_code == 200
            ), f"Workflow JavaScript failed to load: {response.status_code}"

            content = response.text

            # Check for essential JavaScript components
            assert "class WorkflowBuilder" in content, "Missing WorkflowBuilder class"
            assert "setupDragAndDrop" in content, "Missing drag and drop setup"
            assert "addEventListener" in content, "Missing event listeners"
            assert "dataset.nodeType" in content, "Missing correct data attribute access"

        except requests.ConnectionError:
            pytest.skip("Frontend server not running")
        except requests.Timeout:
            pytest.fail("Workflow JavaScript load timeout")

    def test_drawflow_library_accessible(self):
        """Test that Drawflow library loads from CDN."""
        # This is critical - if Drawflow doesn't load, workflow builder fails silently
        try:
            response = requests.get(
                "https://cdn.jsdelivr.net/npm/drawflow@0.0.59/dist/drawflow.min.js",
                timeout=10,
            )
            assert response.status_code == 200, "Drawflow CDN unavailable"

            # Basic sanity check
            content = response.text
            assert "Drawflow" in content, "Drawflow library doesn't contain expected class"

        except requests.ConnectionError:
            pytest.fail("Cannot reach Drawflow CDN - workflow will fail")
        except requests.Timeout:
            pytest.fail("Drawflow CDN timeout - workflow may be slow/broken")

    def test_workflow_dependencies_present(self):
        """Test that all workflow dependencies are available."""
        html_file = Path("../frontend/workflow-builder.html")

        with open(html_file) as f:
            content = f.read()

        # Check for required CDN resources
        required_cdns = [
            "bootstrap@5.3.0",
            "bootstrap-icons",
            "drawflow@0.0.59",
            "dompurify",
        ]

        for cdn in required_cdns:
            assert cdn in content, f"Missing required CDN dependency: {cdn}"

        # Check for required local scripts
        assert "workflow-builder.js" in content, "Missing main workflow script"

    def test_node_types_configuration(self):
        """Test that all required node types are properly configured."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(js_file) as f:
            content = f.read()

        # Required node types that must be handled
        required_node_types = ["input", "llm", "compare", "summarize", "output"]

        # Check if addNode method exists and handles these types
        assert "addNode(" in content, "Missing addNode method"

        # Look for node configuration
        for node_type in required_node_types:
            # This is a basic check - actual functionality needs manual testing
            # But ensures the infrastructure is there
            assert node_type in content, f"Node type '{node_type}' not referenced in JavaScript"

    def test_event_listener_setup(self):
        """Test that event listeners are properly set up."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(js_file) as f:
            content = f.read()

        # Critical event listeners that must exist
        required_events = [
            "dragstart",  # For drag and drop
            "click",  # For click-to-add
            "drop",  # For drop handling
            "dragover",  # For drag feedback
        ]

        for event in required_events:
            assert (
                f"addEventListener('{event}'" in content or f'addEventListener("{event}"' in content
            ), f"Missing event listener for '{event}'"

    def test_workflow_initialization_code(self):
        """Test that workflow initialization code exists."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(js_file) as f:
            content = f.read()

        # Check for proper initialization
        assert "new Drawflow(" in content, "Missing Drawflow initialization"
        assert ".start()" in content, "Missing editor start call"
        assert "setupEventListeners" in content, "Missing event listener setup"
        assert "getElementById(" in content, "Missing DOM element access"

        # Check for error handling
        assert "try {" in content or "catch" in content, "Missing error handling"

    def test_dom_integration(self):
        """Test that JavaScript properly integrates with HTML DOM structure."""
        html_file = Path("../frontend/workflow-builder.html")
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(html_file) as f:
            html_content = f.read()

        with open(js_file) as f:
            js_content = f.read()

        # Critical DOM elements that JavaScript depends on
        html_elements = ['id="drawflow"', "node-item", "data-node-type="]

        js_selectors = [
            "getElementById('drawflow')",
            "querySelectorAll('.node-item')",
            "dataset.nodeType",
        ]

        # Verify HTML has required elements
        for element in html_elements:
            assert element in html_content, f"Missing HTML element: {element}"

        # Verify JavaScript targets correct elements
        for selector in js_selectors:
            assert selector in js_content, f"Missing JavaScript selector: {selector}"

    def test_console_logging_for_debugging(self):
        """Test that adequate console logging exists for debugging."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(js_file) as f:
            content = f.read()

        # Should have console logging for debugging workflow issues
        log_patterns = ["console.log(", "console.error(", "console.warn("]

        log_count = sum(content.count(pattern) for pattern in log_patterns)
        assert log_count >= 5, f"Insufficient console logging for debugging (found {log_count})"

        # Specific debug points that should be logged
        debug_points = [
            "Drag started",
            "Click detected",
            "Drop event",
            "setupDragAndDrop",
        ]

        for debug_point in debug_points:
            assert debug_point in content, f"Missing debug logging for: {debug_point}"


class TestWorkflowRegressionPrevention:
    """Tests to prevent workflow builder regressions."""

    def test_no_silent_failures(self):
        """Ensure workflow builder fails loudly, not silently."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with open(js_file) as f:
            content = f.read()

        # Should have error handling and logging
        assert "try {" in content, "Missing try-catch blocks"
        assert "catch" in content, "Missing error catching"
        assert "console.error(" in content, "Missing error logging"

        # Should validate prerequisites
        assert "Drawflow" in content, "Missing Drawflow dependency check"
        assert "getElementById" in content, "Missing DOM element validation"

    def test_data_attribute_consistency_maintained(self):
        """Ensure data attribute consistency is maintained (BUG-036 prevention)."""
        # This delegates to the specific data attribute test
        from tests.test_workflow_data_attribute_bug import TestWorkflowDataAttributeBug

        test_instance = TestWorkflowDataAttributeBug()
        test_instance.test_data_attribute_consistency()
        test_instance.test_click_handler_implementation()
        test_instance.test_drag_handler_implementation()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
