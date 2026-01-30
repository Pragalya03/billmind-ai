memory = {}

def learn(original, corrected):
    memory[original.lower()] = {
        "text": corrected,
        "confidence": 1.0
    }

def apply_learning(text):
    entry = memory.get(text.lower())
    if entry:
        return entry["text"], entry["confidence"]
    return text, None
