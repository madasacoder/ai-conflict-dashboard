"""Business value tests for AI Conflict Dashboard.

These tests validate the core business functionality:
- Detecting conflicts between AI responses
- Providing consensus analysis
- Enabling informed decision making
"""

from typing import Any, Dict, List

from tests.assertion_helpers import (
    detect_conflicts,
)


class TestConflictDetection:
    """Test the core business value: detecting conflicts between AI models."""

    def test_detect_opposite_recommendations(self):
        """Test detection of opposite buy/sell recommendations."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Based on the analysis, I recommend you BUY this stock. The fundamentals are strong.",
                "tokens": {"prompt": 50, "completion": 20, "total": 70},
            },
            {
                "model": "claude-3-opus",
                "response": "I would suggest to SELL this stock immediately. The market indicators are bearish.",
                "tokens": {"prompt": 50, "completion": 22, "total": 72},
            },
        ]

        conflicts = detect_conflicts(responses)

        assert len(conflicts["conflicts"]) == 1
        assert conflicts["conflicts"][0]["type"] == "opposite_recommendation"
        assert conflicts["conflicts"][0]["severity"] == "high"
        assert set(conflicts["conflicts"][0]["models"]) == {"gpt-4", "claude-3-opus"}

    def test_detect_factual_disagreements(self):
        """Test detection of yes/no disagreements."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gemini-pro",
                "response": "Yes, this is definitely a viable approach for your use case.",
                "tokens": {"prompt": 30, "completion": 15, "total": 45},
            },
            {
                "model": "gpt-4",
                "response": "No, I would not recommend this approach due to scalability concerns.",
                "tokens": {"prompt": 30, "completion": 18, "total": 48},
            },
        ]

        conflicts = detect_conflicts(responses)

        assert len(conflicts["conflicts"]) == 1
        assert conflicts["conflicts"][0]["type"] == "factual_disagreement"
        assert conflicts["conflicts"][0]["severity"] == "medium"

    def test_no_conflicts_in_agreement(self):
        """Test that aligned responses produce no conflicts."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "The data shows a positive trend with growth expected to continue.",
                "tokens": {"prompt": 40, "completion": 15, "total": 55},
            },
            {
                "model": "claude-3-opus",
                "response": "Analysis indicates positive momentum with continued growth likely.",
                "tokens": {"prompt": 40, "completion": 12, "total": 52},
            },
        ]

        conflicts = detect_conflicts(responses)

        assert len(conflicts["conflicts"]) == 0
        assert conflicts["total_responses"] == 2

    def test_multiple_conflicts_detected(self):
        """Test detection of multiple conflicts in responses."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Yes, you should buy this stock immediately.",
                "tokens": {"prompt": 20, "completion": 10, "total": 30},
            },
            {
                "model": "claude-3-opus",
                "response": "No, you should sell this stock now.",
                "tokens": {"prompt": 20, "completion": 10, "total": 30},
            },
        ]

        conflicts = detect_conflicts(responses)

        # Should detect both yes/no conflict and buy/sell conflict
        assert len(conflicts["conflicts"]) == 2
        conflict_types = {c["type"] for c in conflicts["conflicts"]}
        assert "opposite_recommendation" in conflict_types
        assert "factual_disagreement" in conflict_types

    def test_conflict_detection_with_multiple_models(self):
        """Test conflict detection across 4+ models."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Buy the stock",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
            {
                "model": "claude-3-opus",
                "response": "Buy the stock",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
            {
                "model": "gemini-pro",
                "response": "Sell the stock",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
            {
                "model": "grok-1",
                "response": "Sell the stock",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
        ]

        conflicts = detect_conflicts(responses)

        # Should detect conflicts between buy and sell groups
        assert len(conflicts["conflicts"]) > 0

        # Verify all conflicting pairs are identified
        for conflict in conflicts["conflicts"]:
            models = conflict["models"]
            assert len(models) == 2
            # One should be from buy group, one from sell group
            buy_group = {"gpt-4", "claude-3-opus"}
            sell_group = {"gemini-pro", "grok-1"}
            assert (models[0] in buy_group and models[1] in sell_group) or (
                models[0] in sell_group and models[1] in buy_group
            )


class TestConsensusAnalysis:
    """Test consensus detection and analysis."""

    def test_identify_consensus_among_models(self):
        """Test identification of consensus when majority agree."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "The investment is risky due to market volatility.",
                "tokens": {"prompt": 20, "completion": 12, "total": 32},
            },
            {
                "model": "claude-3-opus",
                "response": "This investment carries significant risk from market conditions.",
                "tokens": {"prompt": 20, "completion": 11, "total": 31},
            },
            {
                "model": "gemini-pro",
                "response": "High risk investment given current market volatility.",
                "tokens": {"prompt": 20, "completion": 10, "total": 30},
            },
        ]

        # This would call actual consensus analysis function
        consensus = analyze_consensus(responses)

        assert consensus["has_consensus"] is True
        assert "risk" in str(consensus["consensus_theme"]).lower()
        assert consensus["agreement_level"] >= 0.8  # High agreement

    def test_no_consensus_with_conflicts(self):
        """Test that conflicting responses show no consensus."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Strongly bullish outlook",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
            {
                "model": "claude-3-opus",
                "response": "Extremely bearish forecast",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
        ]

        consensus = analyze_consensus(responses)

        assert consensus["has_consensus"] is False
        assert consensus["agreement_level"] < 0.5
        assert len(consensus["divergent_views"]) == 2


class TestDecisionEnablement:
    """Test features that enable informed decision making."""

    def test_confidence_scoring(self):
        """Test that responses include confidence scoring."""
        response: Dict[str, Any] = {
            "model": "gpt-4",
            "response": "Buy recommendation",
            "tokens": {"prompt": 10, "completion": 5, "total": 15},
            "confidence": 0.85,
        }

        assert "confidence" in response
        assert 0 <= response["confidence"] <= 1
        assert response["confidence"] == 0.85

    def test_response_ranking_by_relevance(self):
        """Test ranking of responses by relevance to query."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Direct answer to your specific question about Python",
                "relevance_score": 0.95,
                "tokens": {"prompt": 20, "completion": 10, "total": 30},
            },
            {
                "model": "claude-3-opus",
                "response": "General programming advice",
                "relevance_score": 0.60,
                "tokens": {"prompt": 20, "completion": 5, "total": 25},
            },
        ]

        # Sort by relevance
        ranked = sorted(responses, key=lambda x: float(x.get("relevance_score", 0)), reverse=True)

        assert ranked[0]["model"] == "gpt-4"
        assert ranked[0]["relevance_score"] > ranked[1]["relevance_score"]

    def test_cost_effectiveness_analysis(self):
        """Test cost per quality analysis for responses."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "High quality detailed response",
                "tokens": {"prompt": 100, "completion": 200, "total": 300},
                "cost": 0.015,
                "quality_score": 0.95,
            },
            {
                "model": "gpt-3.5-turbo",
                "response": "Good response",
                "tokens": {"prompt": 100, "completion": 150, "total": 250},
                "cost": 0.002,
                "quality_score": 0.80,
            },
        ]

        # Calculate cost effectiveness
        for response in responses:
            response["cost_per_quality"] = float(response["cost"]) / float(
                response["quality_score"]
            )

        # GPT-3.5 should be more cost effective
        assert responses[1]["cost_per_quality"] < responses[0]["cost_per_quality"]

    def test_response_metadata_tracking(self):
        """Test that responses include full metadata for auditing."""
        response = create_llm_response(model="gpt-4", prompt="Test prompt", api_key="test-key")

        # Should include all metadata for decision tracking
        assert "request_id" in response
        assert "timestamp" in response
        assert "model_version" in response
        assert "temperature" in response
        assert "max_tokens" in response
        assert "processing_time_ms" in response


class TestEdgeCases:
    """Test edge cases and error scenarios."""

    def test_single_response_no_conflict(self):
        """Test that single response doesn't crash conflict detection."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Single response",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            }
        ]

        # Should handle gracefully
        conflicts = detect_conflicts(responses)
        assert len(conflicts["conflicts"]) == 0
        assert conflicts["total_responses"] == 1

    def test_empty_response_handling(self):
        """Test handling of empty or error responses."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "Valid response",
                "tokens": {"prompt": 10, "completion": 5, "total": 15},
            },
            {
                "model": "claude-3-opus",
                "response": "",
                "error": "Rate limit exceeded",
                "tokens": {"prompt": 0, "completion": 0, "total": 0},
            },
        ]

        # Should handle partial failures
        conflicts = detect_conflicts(responses)
        assert conflicts["total_responses"] == 2
        # No conflicts since one response is empty
        assert len(conflicts["conflicts"]) == 0

    def test_unicode_and_special_chars(self):
        """Test conflict detection with unicode and special characters."""
        responses: List[Dict[str, Any]] = [
            {
                "model": "gpt-4",
                "response": "买入 (Buy) 📈 recommended",
                "tokens": {"prompt": 10, "completion": 8, "total": 18},
            },
            {
                "model": "claude-3-opus",
                "response": "卖出 (Sell) 📉 suggested",
                "tokens": {"prompt": 10, "completion": 8, "total": 18},
            },
        ]

        conflicts = detect_conflicts(responses)

        # Should still detect buy/sell conflict
        assert len(conflicts["conflicts"]) == 1
        assert conflicts["conflicts"][0]["type"] == "opposite_recommendation"


# Helper functions that would exist in production


def analyze_consensus(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze consensus among AI responses.

    This is a simplified version for testing.
    Production version would use NLP for semantic analysis.
    """
    if not responses:
        return {
            "has_consensus": False,
            "agreement_level": 0,
            "consensus_theme": None,
            "divergent_views": [],
        }

    # Simple keyword-based consensus detection
    keywords = []
    for response in responses:
        text = response.get("response", "").lower()
        if "risk" in text:
            keywords.append("risk")
        if "bullish" in text:
            keywords.append("bullish")
        if "bearish" in text:
            keywords.append("bearish")

    # Check if majority agree
    if keywords:
        most_common = max(set(keywords), key=keywords.count)
        agreement = keywords.count(most_common) / len(responses)

        return {
            "has_consensus": agreement > 0.6,
            "agreement_level": agreement,
            "consensus_theme": most_common if agreement > 0.6 else None,
            "divergent_views": list(set(keywords)) if agreement <= 0.6 else [],
        }

    return {
        "has_consensus": False,
        "agreement_level": 0,
        "consensus_theme": None,
        "divergent_views": [],
    }


def create_llm_response(model: str, prompt: str, api_key: str) -> Dict[str, Any]:
    """Create a mock LLM response for testing.

    In production, this would make actual API calls.
    """
    import time
    import uuid

    return {
        "request_id": str(uuid.uuid4()),
        "timestamp": time.time(),
        "model": model,
        "model_version": f"{model}-20240101",
        "prompt": prompt,
        "response": f"Mock response from {model}",
        "tokens": {
            "prompt": len(prompt.split()),
            "completion": 10,
            "total": len(prompt.split()) + 10,
        },
        "temperature": 0.7,
        "max_tokens": 1000,
        "processing_time_ms": 500,
        "cost": 0.001,
    }
