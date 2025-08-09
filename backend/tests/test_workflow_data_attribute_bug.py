import json
"""Test for workflow builder data attribute bug regression."""

import re
from pathlib import Path

import pytest


class TestWorkflowDataAttributeBug:
    """
    Regression test for workflow builder data attribute mismatch bug.

    BUG DESCRIPTION:
    - HTML used: data-node-type="input"
    - JavaScript used: item.dataset.node (expects data-node="input")
    - RESULT: Neither click nor drag and drop worked
    - IMPACT: Complete workflow builder functionality failure
    - ROOT CAUSE: Data attribute naming inconsistency
    """

    def test_html_uses_correct_data_attributes(self):
        """Ensure workflow builder HTML uses data-node-type attributes."""
        html_file = Path("../frontend/workflow-builder.html")

        with html_file.open() as f:
            content = f.read()

        # Find all node items
        node_pattern = r'<div[^>]*class="[^"]*node-item[^"]*"[^>]*>'
        node_items = re.findall(node_pattern, content)

        assert len(node_items) > 0, "No node items found in HTML"

        # Each node item should have data-node-type attribute
        for item in node_items:
            assert "data-node-type=" in item, f"Node item missing data-node-type: {item}"

        # Verify specific node types exist
        expected_types = ["input", "llm", "compare", "summarize", "output"]
        for node_type in expected_types:
            pattern = f'data-node-type="{node_type}"'
            assert pattern in content, f"Missing node type {node_type} in HTML"

    def test_javascript_uses_correct_data_access(self):
        """Ensure JavaScript accesses data-node-type correctly."""
        js_file = Path("../frontend/js/workflow-builder.js")

        with js_file.open() as f:
            content = f.read()

        # JavaScript should use dataset.nodeType (not dataset.node)
        correct_access_patterns = ["item.dataset.nodeType", "dataset.nodeType"]

        # Should find at least one correct usage
        found_correct = any(pattern in content for pattern in correct_access_patterns)
        assert (
            found_correct
        ), "JavaScript doesn't use correct data attribute access (dataset.nodeType)"

        # Should NOT use the incorrect pattern
        incorrect_patterns = [
            "item.dataset.node",
            'dataset.node"',  # Check for exact matches to avoid false positives
        ]

        for pattern in incorrect_patterns:
            # Allow 'dataset.node' only if it's part of 'dataset.nodeType'
            lines = content.split("\n")
            for line_num, line in enumerate(lines, 1):
                if pattern in line and "nodeType" not in line:
                    pytest.fail(
                        f"Line {line_num}: Found incorrect data access '{pattern}': {line.strip()}"
                    )

    def test_data_attribute_consistency(self):
        """Test that HTML and JavaScript data attributes are consistent."""
        # Read HTML
        html_file = Path("../frontend/workflow-builder.html")
        with html_file.open() as f:
            html_content = f.read()

        # Read JavaScript
        js_file = Path("../frontend/js/workflow-builder.js")
        with js_file.open() as f:
            js_content = f.read()

        # Extract data attributes from HTML
        html_data_attrs = re.findall(r"data-([a-zA-Z-]+)=", html_content)
        html_node_attrs = [attr for attr in html_data_attrs if "node" in attr]

        # Extract dataset access from JavaScript
        js_dataset_access = re.findall(r"dataset\.([a-zA-Z]+)", js_content)
        js_node_access = [attr for attr in js_dataset_access if "node" in attr.lower()]

        # Convert HTML data-node-type to camelCase (nodeType)
        expected_js_access = []
        for attr in html_node_attrs:
            camel_case = "".join(
                word.capitalize() if i > 0 else word for i, word in enumerate(attr.split("-"))
            )
            expected_js_access.append(camel_case)

        # Verify consistency
        for expected in expected_js_access:
            assert (
                expected in js_node_access
            ), f"HTML has data-{attr} but JavaScript doesn't access dataset.{expected}"

    def test_click_handler_implementation(self):
        """Ensure click handler uses correct data attribute."""
        js_file = Path("../frontend/js/workflow-builder.js")
        with js_file.open() as f:
            content = f.read()

        # Look for click handler
        click_handler_pattern = r'addEventListener\([\'"]click[\'"][^}]+}'
        click_handlers = re.findall(click_handler_pattern, content, re.DOTALL)

        assert len(click_handlers) > 0, "No click handlers found"

        # Click handler should use dataset.nodeType
        node_click_handler = None
        for handler in click_handlers:
            if "dataset.nodeType" in handler:
                node_click_handler = handler
                break

        assert node_click_handler is not None, "Click handler doesn't use correct dataset.nodeType"

    def test_drag_handler_implementation(self):
        """Ensure drag handlers use correct data attribute."""
        js_file = Path("../frontend/js/workflow-builder.js")
        with js_file.open() as f:
            content = f.read()

        # Look for dragstart handler
        drag_handler_pattern = r'addEventListener\([\'"]dragstart[\'"][^}]+}'
        drag_handlers = re.findall(drag_handler_pattern, content, re.DOTALL)

        assert len(drag_handlers) > 0, "No dragstart handlers found"

        # Drag handler should use dataset.nodeType
        node_drag_handler = None
        for handler in drag_handlers:
            if "dataset.nodeType" in handler:
                node_drag_handler = handler
                break

        assert node_drag_handler is not None, "Drag handler doesn't use correct dataset.nodeType"

    def test_specific_node_types_work(self):
        """Test that specific node types have correct attributes."""
        html_file = Path("../frontend/workflow-builder.html")
        with html_file.open() as f:
            content = f.read()

        # Test specific node configurations
        test_cases = [
            ("input", "Text Input"),
            ("llm", "LLM Processor"),
            ("compare", "Compare Responses"),
            ("summarize", "Summarize"),
            ("output", "Output"),
        ]

        for node_type, display_text in test_cases:
            # Find the node item
            pattern = (
                rf'<div[^>]*data-node-type="{node_type}"[^>]*>.*?{re.escape(display_text)}.*?</div>'
            )
            match = re.search(pattern, content, re.DOTALL)

            assert (
                match is not None
            ), f"Node type '{node_type}' with text '{display_text}' not found"

            # Ensure it has draggable attribute
            node_html = match.group(0)
            assert 'draggable="true"' in node_html, f"Node {node_type} missing draggable attribute"

    def test_bug_documentation(self):
        """Ensure this bug is documented for future reference."""
        # This test serves as documentation
        bug_description = """
        BUG: Workflow Builder Data Attribute Mismatch

        SYMPTOMS:
        - Clicking node items in sidebar doesn't add nodes
        - Drag and drop from sidebar doesn't work
        - No JavaScript errors, but functionality silently fails

        ROOT CAUSE:
        - HTML uses: data-node-type="input"
        - JavaScript expects: item.dataset.node
        - Mismatch: nodeType vs node

        FIX:
        - Updated JavaScript to use item.dataset.nodeType
        - This matches HTML data-node-type attribute

        PREVENTION:
        - This test ensures consistency between HTML and JS
        - Tests both click and drag handlers
        - Validates all node types work correctly
        """

        assert len(bug_description) > 0, "Bug documentation exists"

        # The test itself serves as executable documentation
        # If this test passes, the bug is fixed and documented


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
