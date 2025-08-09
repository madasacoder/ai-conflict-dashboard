"""
Workflow Executor for Web App
Handles workflow execution from the visual builder
"""

import asyncio
from collections import defaultdict, deque
from typing import Any

import structlog

from llm_providers import call_claude, call_gemini, call_grok, call_ollama_fixed, call_openai
from structured_logging import sanitize_sensitive_data

# TokenCounter not needed for basic workflow execution

logger = structlog.get_logger(__name__)


class WorkflowExecutor:
    """Execute visual workflows with proper topological ordering."""

    def __init__(self, api_keys: dict[str, str]):
        self.api_keys = api_keys
        self.results = {}

    async def execute(self, nodes: list[dict], edges: list[dict]) -> dict[str, Any]:
        """
        Execute a workflow defined by nodes and edges.

        Args:
            nodes: List of node definitions with id, type, and data
            edges: List of edge definitions with source and target

        Returns:
            Dictionary with execution results for each node
        """
        logger.info("Starting workflow execution", node_count=len(nodes), edge_count=len(edges))

        # Build adjacency list for topological sort
        graph = defaultdict(list)
        in_degree = defaultdict(int)
        node_map = {node["id"]: node for node in nodes}

        # Initialize all nodes
        for node in nodes:
            in_degree[node["id"]] = 0

        # Build graph
        for edge in edges:
            graph[edge["source"]].append(edge["target"])
            in_degree[edge["target"]] += 1

        # Find execution order using topological sort
        queue = deque([node_id for node_id in in_degree if in_degree[node_id] == 0])
        execution_order = []

        while queue:
            node_id = queue.popleft()
            execution_order.append(node_id)

            for neighbor in graph[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Check for cycles
        if len(execution_order) != len(nodes):
            raise ValueError("Workflow contains cycles")

        # Execute nodes in order
        for node_id in execution_order:
            node = node_map[node_id]
            logger.info("Executing node", node_id=node_id, node_type=node.get("type"))
            logger.debug("Node details", node=node)
            await self._execute_node(node, graph, edges)
            logger.info("Node execution completed", node_id=node_id)

        logger.info("Workflow execution completed", result_count=len(self.results))
        return self.results

    async def _execute_node(self, node: dict, graph: dict, edges: list[dict]) -> Any:
        """Execute a single node based on its type."""
        node_id = node["id"]
        node_type = node["type"]
        node_data = node.get("data", {})

        logger.info("Executing node", node_id=node_id, node_type=node_type)

        try:
            logger.debug(
                "Node execution details", node_id=node_id, node_type=node_type, node_data=node_data
            )

            if node_type == "input":
                logger.debug("Calling _execute_input_node")
                result = await self._execute_input_node(node_data)
                logger.debug("_execute_input_node result", result=result)

            elif node_type == "llm":
                # Get input from connected nodes
                input_text = await self._get_node_inputs(node_id, edges)
                result = await self._execute_llm_node(node_data, input_text)

            elif node_type == "compare":
                # Get multiple inputs
                inputs = await self._get_all_node_inputs(node_id, edges)
                result = await self._execute_compare_node(node_data, inputs)

            elif node_type == "summarize":
                input_text = await self._get_node_inputs(node_id, edges)
                result = await self._execute_summarize_node(node_data, input_text)

            elif node_type == "output":
                input_data = await self._get_node_inputs(node_id, edges)
                result = await self._execute_output_node(node_data, input_data)

            else:
                raise ValueError(f"Unknown node type: {node_type}")

            self.results[node_id] = {
                "type": node_type,
                "status": "success",
                "result": result,
            }

            return result

        except Exception as e:
            sanitized_error = sanitize_sensitive_data(str(e))
            logger.error("Node execution failed", node_id=node_id, error=sanitized_error)
            self.results[node_id] = {
                "type": node_type,
                "status": "error",
                "error": sanitized_error,
            }

            return None

    async def _execute_input_node(self, data: dict) -> str:
        """Execute input node - return the content."""
        input_type = data.get("type", "text")

        # Handle different input field names
        content = data.get("content", "") or data.get("text", "")

        logger.info("Input node data", data=data, input_type=input_type, content=content)

        if input_type == "text":
            return content
        elif input_type == "file":
            # In web app, file content would be uploaded
            return data.get("fileContent", "")
        elif input_type == "url":
            # Could fetch URL content here
            return f"Content from URL: {content}"
        else:
            return content

    async def _execute_llm_node(self, data: dict, input_text: str) -> dict:
        """Execute LLM analysis node."""
        models = data.get("models", ["gpt-4"])
        prompt = data.get("prompt", "Analyze the following text:\n\n{input}")
        temperature = data.get("temperature", 0.5)
        max_tokens = data.get("maxTokens", 2000)

        # Replace {input} placeholder
        full_prompt = prompt.replace("{input}", input_text)

        # Get responses from all selected models
        responses = {}
        for model in models:
            try:
                # Map frontend model names to backend
                model_mapping = {
                    "gpt-4": "openai",
                    "claude-3-opus": "claude",
                    "gemini-pro": "gemini",
                    "grok": "grok",
                    "ollama": "ollama",
                }

                backend_model = model_mapping.get(model, model)

                # Special handling for Ollama (no API key needed)
                if backend_model == "ollama":
                    response = await call_ollama_fixed(
                        full_prompt,
                        model="llama3.3:70b",  # Use available model
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    responses[model] = response
                elif backend_model == "openai" and self.api_keys.get("openai"):
                    response = await call_openai(
                        full_prompt,
                        api_key=self.api_keys["openai"],
                        model="gpt-4",
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    responses[model] = response
                elif backend_model == "claude" and self.api_keys.get("claude"):
                    response = await call_claude(
                        full_prompt,
                        api_key=self.api_keys["claude"],
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    responses[model] = response
                elif backend_model == "gemini" and self.api_keys.get("gemini"):
                    response = await call_gemini(
                        full_prompt,
                        api_key=self.api_keys["gemini"],
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    responses[model] = response
                elif backend_model == "grok" and self.api_keys.get("grok"):
                    response = await call_grok(
                        full_prompt,
                        api_key=self.api_keys["grok"],
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    responses[model] = response
                else:
                    responses[model] = {"error": f"No API key for {model}"}

            except Exception as e:
                sanitized_error = sanitize_sensitive_data(str(e))
                responses[model] = {"error": sanitized_error}

        return responses

    async def _execute_compare_node(self, data: dict, inputs: list[str]) -> dict:
        """Execute comparison node."""
        comparison_type = data.get("comparisonType", "conflicts")

        if len(inputs) < 2:
            return {"error": "Compare node requires at least 2 inputs"}

        # Simple comparison logic
        result = {
            "comparison_type": comparison_type,
            "inputs_count": len(inputs),
            "analysis": {},
        }

        if comparison_type == "conflicts":
            # Find conflicting statements
            result["analysis"]["conflicts"] = self._find_conflicts(inputs)
        elif comparison_type == "consensus":
            # Find agreements
            result["analysis"]["consensus"] = self._find_consensus(inputs)
        else:
            # All differences
            result["analysis"]["differences"] = self._find_differences(inputs)

        return result

    async def _execute_summarize_node(self, data: dict, input_text: str) -> str:
        """Execute summarization node."""
        length = data.get("length", "medium")
        data.get("style", "paragraph")

        # Simple summarization (in production, would use LLM)
        lines = input_text.split("\n")

        if length == "short":
            summary = "\n".join(lines[:3]) + "..."
        elif length == "long":
            summary = input_text
        else:
            summary = "\n".join(lines[:10]) + "..."

        return summary

    async def _execute_output_node(self, data: dict, input_data: Any) -> dict:
        """Execute output node - format the results."""
        output_format = data.get("format", "markdown")
        include_metadata = data.get("includeMetadata", False)

        result = {"format": output_format, "content": input_data}

        if include_metadata:
            result["metadata"] = {
                "timestamp": asyncio.get_event_loop().time(),
                "node_count": len(self.results),
            }

        return result

    async def _get_node_inputs(self, node_id: str, edges: list[dict]) -> str:
        """Get input for a node from connected sources."""
        inputs = []

        for edge in edges:
            if edge["target"] == node_id:
                source_id = edge["source"]
                if source_id in self.results:
                    result = self.results[source_id].get("result", "")
                    if isinstance(result, dict):
                        # Handle complex results
                        inputs.append(str(result))
                    else:
                        inputs.append(str(result))

        return "\n".join(inputs) if inputs else ""

    async def _get_all_node_inputs(self, node_id: str, edges: list[dict]) -> list[str]:
        """Get all inputs for a node as a list."""
        inputs = []

        for edge in edges:
            if edge["target"] == node_id:
                source_id = edge["source"]
                if source_id in self.results:
                    result = self.results[source_id].get("result", "")
                    inputs.append(str(result))

        return inputs

    def _find_conflicts(self, inputs: list[str]) -> list[str]:
        """Simple conflict detection."""
        # In production, would use NLP
        return ["Different perspectives detected across inputs"]

    def _find_consensus(self, inputs: list[str]) -> list[str]:
        """Simple consensus detection."""
        return ["Common themes found across inputs"]

    def _find_differences(self, inputs: list[str]) -> list[str]:
        """Simple difference detection."""
        return ["Multiple unique viewpoints identified"]
