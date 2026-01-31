memory = {
    "replace": {},
    "delete": set()
}

def learn(original, corrected):
    memory["replace"][original.lower()] = {
        "text": corrected,
        "confidence": 1.0
    }

def delete_word(text):
    memory["delete"].add(text.lower())

def apply_learning(text):
    if text.lower() in memory["delete"]:
        return None, None

    entry = memory["replace"].get(text.lower())
    if entry:
        return entry["text"], 1.0

    return text, None
