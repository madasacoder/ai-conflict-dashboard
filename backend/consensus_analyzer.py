"""Consensus analysis for multiple model responses."""

from typing import Dict, List, Any
from difflib import SequenceMatcher
import re

from structured_logging import get_logger

logger = get_logger(__name__)


class ConsensusAnalyzer:
    """Analyze consensus and conflicts between multiple AI model responses."""
    
    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """Calculate similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        if not text1 or not text2:
            return 0.0
            
        # Normalize texts for comparison
        normalized1 = text1.lower().strip()
        normalized2 = text2.lower().strip()
        
        # Use sequence matcher for similarity
        matcher = SequenceMatcher(None, normalized1, normalized2)
        return matcher.ratio()
    
    @staticmethod
    def extract_key_points(text: str) -> List[str]:
        """Extract key points from text.
        
        Args:
            text: Input text
            
        Returns:
            List of key points
        """
        if not text:
            return []
            
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        
        # Filter and clean sentences
        key_points = []
        for sentence in sentences:
            cleaned = sentence.strip()
            if len(cleaned) > 20:  # Minimum length for a meaningful point
                key_points.append(cleaned)
                
        return key_points[:5]  # Return top 5 points
    
    @classmethod
    def analyze_consensus(cls, responses: List[Any]) -> Dict[str, Any]:
        """Analyze consensus between multiple model responses.
        
        Args:
            responses: List of model responses (can be dict or ModelResponse objects)
            
        Returns:
            Consensus analysis including agreement level and conflicts
        """
        if not responses:
            return {
                "has_consensus": False,
                "agreement_level": 0.0,
                "conflicts": [],
                "common_points": [],
                "divergent_points": []
            }
        
        # Convert ModelResponse objects to dicts if needed
        response_dicts = []
        for r in responses:
            if hasattr(r, 'model') and hasattr(r, 'response'):
                # It's a ModelResponse object
                response_dicts.append({
                    "model": r.model,
                    "response": r.response,
                    "error": r.error
                })
            elif isinstance(r, dict):
                response_dicts.append(r)
            else:
                continue
        
        # Filter valid responses
        valid_responses = [
            r for r in response_dicts 
            if r.get("response") and not r.get("error")
        ]
        
        if len(valid_responses) < 2:
            return {
                "has_consensus": False,
                "agreement_level": 0.0 if len(valid_responses) == 0 else 1.0,
                "conflicts": [],
                "common_points": [],
                "divergent_points": [],
                "note": "Insufficient valid responses for consensus analysis"
            }
        
        # Calculate pairwise similarities
        similarities = []
        conflicts = []
        
        for i in range(len(valid_responses)):
            for j in range(i + 1, len(valid_responses)):
                resp1 = valid_responses[i]
                resp2 = valid_responses[j]
                
                similarity = cls.calculate_similarity(
                    resp1["response"], 
                    resp2["response"]
                )
                similarities.append(similarity)
                
                # Check for direct conflicts (opposite answers)
                if cls._detect_conflict(resp1["response"], resp2["response"]):
                    conflicts.append({
                        "model1": resp1.get("model", "unknown"),
                        "model2": resp2.get("model", "unknown"),
                        "type": "direct_conflict"
                    })
        
        # Calculate overall agreement level
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0.0
        
        # Determine consensus
        has_consensus = avg_similarity > 0.7 and len(conflicts) == 0
        
        # Extract common and divergent points
        all_points = []
        for resp in valid_responses:
            points = cls.extract_key_points(resp["response"])
            all_points.extend(points)
        
        # Find common points (appear in multiple responses)
        point_counts = {}
        for point in all_points:
            normalized = point.lower()
            point_counts[normalized] = point_counts.get(normalized, 0) + 1
        
        common_points = [
            point for point, count in point_counts.items() 
            if count >= len(valid_responses) / 2
        ][:3]
        
        divergent_points = [
            point for point, count in point_counts.items()
            if count == 1
        ][:3]
        
        return {
            "has_consensus": has_consensus,
            "agreement_level": round(avg_similarity, 3),
            "has_conflict": len(conflicts) > 0,
            "conflicts": conflicts,
            "common_points": common_points,
            "divergent_points": divergent_points,
            "models_analyzed": len(valid_responses),
            "models": [r.get("model", "unknown") for r in valid_responses]
        }
    
    @staticmethod
    def _detect_conflict(text1: str, text2: str) -> bool:
        """Detect if two texts have conflicting information.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            True if conflict detected
        """
        # Normalize texts
        norm1 = text1.lower().strip()
        norm2 = text2.lower().strip()
        
        # Check for opposite answers - look for strong indicators
        opposite_pairs = [
            ("definitely yes", "definitely no"),
            ("yes", "no"),
            ("true", "false"),
            ("correct", "incorrect"),
            ("right", "wrong"),
            ("positive", "negative"),
            ("agree", "disagree"),
            ("definitely", "definitely not"),
            ("always", "never"),
            ("is yes", "is no"),
            ("is definitely yes", "is definitely no"),
        ]
        
        for pos, neg in opposite_pairs:
            # Check if one text strongly affirms while other strongly denies
            if (pos in norm1 and neg in norm2) or (neg in norm1 and pos in norm2):
                # Extra check: make sure these are meaningful (not part of longer words)
                if " " + pos in " " + norm1 or norm1.startswith(pos) or norm1.endswith(pos):
                    if " " + neg in " " + norm2 or norm2.startswith(neg) or norm2.endswith(neg):
                        return True
                if " " + neg in " " + norm1 or norm1.startswith(neg) or norm1.endswith(neg):
                    if " " + pos in " " + norm2 or norm2.startswith(pos) or norm2.endswith(pos):
                        return True
        
        # Check for contradictory numbers/quantities
        numbers1 = re.findall(r'\d+', norm1)
        numbers2 = re.findall(r'\d+', norm2)
        
        if numbers1 and numbers2:
            # If texts contain different numbers for the same concept
            if set(numbers1).isdisjoint(set(numbers2)):
                # Could indicate conflict (e.g., "5 reasons" vs "3 reasons")
                return len(numbers1) > 0 and len(numbers2) > 0
        
        return False