memory = {}

def learn(original, corrected):
    memory[original.lower()] = corrected

def apply_learning(text):
    return memory.get(text.lower(), text)
