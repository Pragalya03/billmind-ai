from services.preprocess import preprocess_image
from services.ocr import extract_text
from agents.confidence_agent import evaluate
from agents.semantic_agent import semantic_label
from agents.error_agent import detect
from agents.workflow_agent import decide

def process_bill(path):
    original, _ = preprocess_image(path)

    ocr = extract_text(original)
    semantic = semantic_label(ocr)

    confidence = evaluate(ocr)

    issue_result = detect(semantic)

    decision = decide(confidence, issue_result["errors"])

    return {
        "items": ocr,
        "semantic": semantic,
        "confidence": confidence,
        "errors": issue_result["errors"],
        "suggestions": issue_result["suggestions"],
        "computed_total": issue_result["computed_total"],
        "marked_total": issue_result["marked_total"],
        "decision": decision
    }
