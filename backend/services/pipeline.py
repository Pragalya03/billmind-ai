from services.preprocess import preprocess_image
from services.ocr import extract_text
from agents.confidence_agent import evaluate
from agents.error_agent import detect
from agents.workflow_agent import decide

def process_bill(path):
    original, enhanced = preprocess_image(path)

    ocr = extract_text(original)  # IMPORTANT: original image

    confidence = evaluate(ocr)
    issue_result = detect(ocr)
    decision = decide(confidence, issue_result)

    return {
    "items": ocr,
    "confidence": confidence,
    "errors": issue_result["errors"],
    "suggestions": issue_result["suggestions"],
    "decision": decision
    }

