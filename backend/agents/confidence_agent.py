def evaluate(items):
    if not items:
        return 0.0
    return sum(i["confidence"] for i in items) / len(items)
