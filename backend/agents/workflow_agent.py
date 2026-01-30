def decide(confidence, errors):
    if confidence > 0.9 and not errors:
        return "AUTO_SAVE"
    if confidence > 0.6:
        return "PARTIAL_REVIEW"
    return "FULL_REVIEW"
