#!/usr/bin/env python3
"""
Direct test of Ollama translation pipeline
Shows original story → translations → final result
"""

import requests
import json
import time

# Original story
original_story = """Once upon a time, in a small village nestled between mountains, 
there lived a young girl named Luna who discovered she could speak to the wind. 
The wind would whisper secrets of distant lands and carry messages across the valley. 
One day, the wind brought news of a terrible storm approaching. 
Luna warned the villagers, who prepared and saved their harvest. 
From that day, Luna became the village's guardian, listening to nature's warnings."""

print("🌟 OLLAMA TRANSLATION PIPELINE TEST")
print("=" * 70)
print("\n📖 ORIGINAL STORY:")
print("-" * 70)
print(original_story)
print("-" * 70)

# Step 1: Analyze the story
print("\n🔍 STEP 1: Analyzing story with Ollama (gemma3:4b)...")
response1 = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "text": original_story,
        "models": ["ollama"],
        "ollama_model": "gemma3:4b",
        "prompt": "Analyze this story and identify the main themes and message. Be concise."
    }
)
analysis = response1.json()["responses"][0]["response"]
print("\nANALYSIS:")
print(analysis)

# Step 2: Translate to Chinese
print("\n🇨🇳 STEP 2: Translating to Chinese...")
response2 = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "text": analysis,
        "models": ["ollama"],
        "ollama_model": "gemma3:4b",
        "prompt": "Translate this text to Chinese (Simplified). Only provide the translation, no explanations."
    }
)
chinese = response2.json()["responses"][0]["response"]
print("\nCHINESE TRANSLATION:")
print(chinese)

# Step 3: Translate to French
print("\n🇫🇷 STEP 3: Translating Chinese to French...")
response3 = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "text": chinese,
        "models": ["ollama"],
        "ollama_model": "gemma3:4b",
        "prompt": "Translate this Chinese text to French. Only provide the translation."
    }
)
french = response3.json()["responses"][0]["response"]
print("\nFRENCH TRANSLATION:")
print(french)

# Step 4: Translate back to English
print("\n🇺🇸 STEP 4: Translating French back to English...")
response4 = requests.post(
    "http://localhost:8000/api/analyze",
    json={
        "text": french,
        "models": ["ollama"],
        "ollama_model": "gemma3:4b",
        "prompt": "Translate this French text back to English. Only provide the translation."
    }
)
final_english = response4.json()["responses"][0]["response"]
print("\nFINAL ENGLISH:")
print(final_english)

# Compare
print("\n" + "=" * 70)
print("📊 COMPARISON:")
print("=" * 70)
print("\nORIGINAL ANALYSIS:")
print(analysis[:200] + "..." if len(analysis) > 200 else analysis)
print("\nAFTER TRANSLATION CHAIN:")
print(final_english[:200] + "..." if len(final_english) > 200 else final_english)
print("\n✅ Translation pipeline complete!")