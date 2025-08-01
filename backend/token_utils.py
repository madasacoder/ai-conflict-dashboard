"""
Token counting and validation utilities for API limits.
"""

# API token limits
MODEL_LIMITS = {
    "gpt-3.5-turbo": {
        "max_tokens": 4096,
        "max_response_tokens": 1000,
        "name": "OpenAI GPT-3.5 Turbo"
    },
    "claude-3-haiku-20240307": {
        "max_tokens": 200000,  # Claude 3 Haiku supports 200k tokens
        "max_response_tokens": 1000,
        "name": "Claude 3 Haiku"
    }
}

def estimate_tokens(text: str) -> int:
    """
    Estimate token count for a given text.
    Rough estimate: 1 token ≈ 4 characters or 0.75 words
    """
    # More accurate estimation based on common patterns
    # Count words and characters
    words = len(text.split())
    chars = len(text)
    
    # Use the more conservative estimate
    token_by_words = int(words / 0.75)
    token_by_chars = int(chars / 4)
    
    return max(token_by_words, token_by_chars)

def check_token_limits(text: str) -> dict:
    """
    Check if text exceeds token limits for each model.
    Returns warnings and recommendations.
    """
    estimated_tokens = estimate_tokens(text)
    
    warnings = []
    recommendations = []
    
    for model_id, limits in MODEL_LIMITS.items():
        # Account for response tokens
        total_needed = estimated_tokens + limits["max_response_tokens"]
        
        if total_needed > limits["max_tokens"]:
            warnings.append({
                "model": limits["name"],
                "estimated_tokens": estimated_tokens,
                "max_tokens": limits["max_tokens"],
                "exceeds_by": total_needed - limits["max_tokens"]
            })
            
            # Calculate how much text needs to be reduced
            chars_to_reduce = (total_needed - limits["max_tokens"]) * 4
            recommendations.append(
                f"Reduce text by approximately {chars_to_reduce:,} characters for {limits['name']}"
            )
    
    return {
        "estimated_tokens": estimated_tokens,
        "warnings": warnings,
        "recommendations": recommendations,
        "safe_for_all": len(warnings) == 0
    }

def chunk_text(text: str, max_tokens: int = 3000) -> list[str]:
    """
    Split text into chunks that fit within token limits.
    Tries to split at sentence boundaries for better context.
    """
    # Simple implementation - can be improved with better sentence detection
    sentences = text.split('. ')
    chunks = []
    current_chunk = []
    current_tokens = 0
    
    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)
        
        if current_tokens + sentence_tokens > max_tokens:
            # Start new chunk
            if current_chunk:
                chunks.append('. '.join(current_chunk) + '.')
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens
    
    # Add last chunk
    if current_chunk:
        chunks.append('. '.join(current_chunk))
    
    return chunks