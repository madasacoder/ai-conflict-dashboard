"""
Workflow execution engine for the desktop app.

Executes workflows by processing nodes in topological order.
"""

import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import json
import sys
import os

# Add parent backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from llm_providers import call_openai, call_claude, call_gemini, call_grok
from plugins.ollama_provider import call_ollama
from smart_chunking import chunk_text_smart


@dataclass
class NodeExecution:
    """Result of executing a single node."""
    node_id: str
    output: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = None


class WorkflowEngine:
    """Execute workflows by processing nodes in dependency order."""
    
    def __init__(self, api_keys: Dict[str, str]):
        """Initialize with API keys for LLM providers."""
        self.api_keys = api_keys
        self.execution_cache: Dict[str, NodeExecution] = {}
        
    async def execute_workflow(
        self, 
        nodes: List[Dict[str, Any]], 
        edges: List[Dict[str, Any]],
        progress_callback=None
    ) -> Dict[str, NodeExecution]:
        """
        Execute a workflow and return results.
        
        Args:
            nodes: List of workflow nodes
            edges: List of connections between nodes
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict mapping node IDs to execution results
        """
        # Build adjacency list and find execution order
        graph = self._build_graph(nodes, edges)
        execution_order = self._topological_sort(graph, nodes)
        
        if not execution_order:
            raise ValueError("Workflow contains cycles or is invalid")
        
        # Execute nodes in order
        total_nodes = len(execution_order)
        
        for idx, node_id in enumerate(execution_order):
            node = next(n for n in nodes if n['id'] == node_id)
            
            # Progress update
            if progress_callback:
                progress = int((idx / total_nodes) * 100)
                await progress_callback(progress, f"Executing {node['data']['label']}")
            
            # Get inputs from connected nodes
            inputs = self._get_node_inputs(node_id, edges)
            
            # Execute node based on type
            try:
                result = await self._execute_node(node, inputs)
                self.execution_cache[node_id] = result
            except Exception as e:
                self.execution_cache[node_id] = NodeExecution(
                    node_id=node_id,
                    output=None,
                    error=str(e)
                )
        
        if progress_callback:
            await progress_callback(100, "Workflow complete")
            
        return self.execution_cache
    
    def _build_graph(self, nodes: List[Dict], edges: List[Dict]) -> Dict[str, List[str]]:
        """Build adjacency list from nodes and edges."""
        graph = {node['id']: [] for node in nodes}
        
        for edge in edges:
            if edge['source'] in graph:
                graph[edge['source']].append(edge['target'])
                
        return graph
    
    def _topological_sort(self, graph: Dict[str, List[str]], nodes: List[Dict]) -> List[str]:
        """Return nodes in topological order for execution."""
        # Calculate in-degrees
        in_degree = {node['id']: 0 for node in nodes}
        
        for node_id in graph:
            for neighbor in graph[node_id]:
                if neighbor in in_degree:
                    in_degree[neighbor] += 1
        
        # Find nodes with no dependencies
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            # Reduce in-degree of neighbors
            for neighbor in graph.get(node_id, []):
                if neighbor in in_degree:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        queue.append(neighbor)
        
        # Check if all nodes were processed (no cycles)
        if len(result) != len(nodes):
            return []
            
        return result
    
    def _get_node_inputs(self, node_id: str, edges: List[Dict]) -> Dict[str, Any]:
        """Get outputs from nodes connected as inputs."""
        inputs = {}
        
        for edge in edges:
            if edge['target'] == node_id:
                source_id = edge['source']
                if source_id in self.execution_cache:
                    source_result = self.execution_cache[source_id]
                    if not source_result.error:
                        inputs[source_id] = source_result.output
                        
        return inputs
    
    async def _execute_node(self, node: Dict, inputs: Dict[str, Any]) -> NodeExecution:
        """Execute a single node based on its type."""
        node_type = node['type']
        node_data = node['data']
        node_id = node['id']
        
        if node_type == 'input':
            return await self._execute_input_node(node_id, node_data)
        elif node_type == 'llm':
            return await self._execute_llm_node(node_id, node_data, inputs)
        elif node_type == 'compare':
            return await self._execute_compare_node(node_id, node_data, inputs)
        elif node_type == 'summarize':
            return await self._execute_summarize_node(node_id, node_data, inputs)
        elif node_type == 'output':
            return await self._execute_output_node(node_id, node_data, inputs)
        else:
            raise ValueError(f"Unknown node type: {node_type}")
    
    async def _execute_input_node(self, node_id: str, data: Dict) -> NodeExecution:
        """Execute input node - just returns the configured input."""
        input_type = data.get('inputType', 'text')
        
        if input_type == 'text':
            output = data.get('value', data.get('placeholder', ''))
        elif input_type == 'file':
            # In real implementation, would read file
            output = f"File content from: {data.get('filePath', 'unknown')}"
        elif input_type == 'url':
            # In real implementation, would fetch URL
            output = f"Content from URL: {data.get('url', 'unknown')}"
        else:
            output = "No input configured"
            
        return NodeExecution(
            node_id=node_id,
            output=output,
            metadata={'type': input_type}
        )
    
    async def _execute_llm_node(self, node_id: str, data: Dict, inputs: Dict) -> NodeExecution:
        """Execute LLM node - calls AI models."""
        # Combine all inputs
        combined_input = "\n\n".join(str(v) for v in inputs.values())
        
        # Get configured models
        models = data.get('models', ['gpt-4'])
        prompt = data.get('prompt', 'Analyze the following:\n\n{input}')
        prompt = prompt.replace('{input}', combined_input)
        
        # Chunk if needed
        chunks = chunk_text_smart(combined_input, max_tokens=4000)
        
        results = {}
        for model in models:
            try:
                if model.startswith('gpt'):
                    api_key = self.api_keys.get('openai')
                    if api_key:
                        response = await call_openai(api_key, prompt, model)
                        results[model] = response
                elif model.startswith('claude'):
                    api_key = self.api_keys.get('claude')
                    if api_key:
                        response = await call_claude(api_key, prompt, model)
                        results[model] = response
                elif model.startswith('gemini'):
                    api_key = self.api_keys.get('gemini')
                    if api_key:
                        response = await call_gemini(api_key, prompt, model)
                        results[model] = response
                elif model == 'grok-beta':
                    api_key = self.api_keys.get('grok')
                    if api_key:
                        response = await call_grok(api_key, prompt)
                        results[model] = response
                elif model.startswith('llama'):
                    response = await call_ollama(prompt, model)
                    results[model] = response
            except Exception as e:
                results[model] = f"Error: {str(e)}"
                
        return NodeExecution(
            node_id=node_id,
            output=results,
            metadata={'models': models, 'prompt_template': data.get('prompt')}
        )
    
    async def _execute_compare_node(self, node_id: str, data: Dict, inputs: Dict) -> NodeExecution:
        """Execute compare node - finds conflicts and consensus."""
        comparison_type = data.get('comparisonType', 'conflicts')
        
        # For now, simple comparison
        all_responses = []
        for input_data in inputs.values():
            if isinstance(input_data, dict):
                all_responses.extend(input_data.values())
            else:
                all_responses.append(str(input_data))
        
        if comparison_type == 'conflicts':
            # Find differences
            unique_responses = list(set(all_responses))
            output = {
                'conflicts': unique_responses if len(unique_responses) > 1 else [],
                'consensus': all_responses[0] if len(unique_responses) == 1 else None
            }
        else:
            output = {'all_responses': all_responses}
            
        return NodeExecution(
            node_id=node_id,
            output=output,
            metadata={'comparison_type': comparison_type}
        )
    
    async def _execute_summarize_node(self, node_id: str, data: Dict, inputs: Dict) -> NodeExecution:
        """Execute summarize node - consolidates results."""
        length = data.get('length', 'medium')
        style = data.get('style', 'paragraph')
        
        # Combine inputs
        combined = []
        for input_data in inputs.values():
            if isinstance(input_data, dict):
                combined.append(json.dumps(input_data, indent=2))
            else:
                combined.append(str(input_data))
        
        # Simple summary for now
        if style == 'bullets':
            output = "Summary:\n" + "\n".join(f"• {item[:100]}..." for item in combined)
        else:
            output = f"Summary of {len(combined)} items:\n\n" + "\n\n".join(combined[:3])
            
        return NodeExecution(
            node_id=node_id,
            output=output,
            metadata={'length': length, 'style': style}
        )
    
    async def _execute_output_node(self, node_id: str, data: Dict, inputs: Dict) -> NodeExecution:
        """Execute output node - formats final results."""
        format_type = data.get('format', 'markdown')
        include_metadata = data.get('includeMetadata', False)
        
        # Format output based on type
        if format_type == 'json':
            output = json.dumps(inputs, indent=2)
        elif format_type == 'markdown':
            output = "# Workflow Results\n\n"
            for key, value in inputs.items():
                output += f"## {key}\n\n{value}\n\n"
        else:
            output = str(inputs)
            
        return NodeExecution(
            node_id=node_id,
            output=output,
            metadata={'format': format_type}
        )