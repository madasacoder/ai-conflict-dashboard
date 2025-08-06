#!/usr/bin/env python3

import asyncio
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from workflow_executor import WorkflowExecutor


async def test_workflow():
    """Test the workflow executor with a simple input node."""

    # Create a simple workflow with one input node
    nodes = [{"id": "test", "type": "input", "data": {"text": "Hello world"}}]
    edges = []
    api_keys = {}

    print("Testing workflow executor...")
    print(f"Nodes: {nodes}")
    print(f"Edges: {edges}")

    # Create executor
    executor = WorkflowExecutor(api_keys)

    # Execute workflow
    print("Executing workflow...")
    results = await executor.execute(nodes, edges)

    print(f"Results: {results}")

    # Check the result
    if "test" in results:
        result_data = results["test"]
        if isinstance(result_data, dict) and "result" in result_data:
            print(f"Input node result: {result_data['result']}")
        else:
            print(f"Input node result: {result_data}")
    else:
        print("No result found for test node")


if __name__ == "__main__":
    asyncio.run(test_workflow())
