from services.preprocess import preprocess_image
from services.ocr import extract_text
from agents.confidence_agent import evaluate
from agents.error_agent import detect
from agents.workflow_agent import decide
from agents.semantic_agent import semantic_label
import numpy as np

def to_python(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: to_python(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_python(v) for v in obj]
    return obj


def process_bill(path):
    original, enhanced = preprocess_image(path)

    ocr = extract_text(original)
    semantic = semantic_label(ocr)
    confidence = evaluate(ocr)

    issue_result = detect(ocr)
    errors = issue_result["errors"]
    suggestions = issue_result["suggestions"]

    decision = decide(confidence, errors)

    return {
        "items": ocr,
        "semantic": semantic,
        "confidence": confidence,
        "errors": errors,
        "suggestions": suggestions,
        "decision": decision
    }
