def collect_review_items(ocr_items, threshold=0.6):
    """
    Collect low-confidence OCR words for user review.
    CONTEXT-AWARE version (required for reinjection).
    PURE function — no DB, no bill_id.
    """
    review = []

    for i in ocr_items:
        confidence = i.get("confidence", 1.0)

        if confidence < threshold:
            review.append({
                "text": i.get("text"),
                "confidence": round(confidence, 2),

                # context for reinjection
                "label": i.get("label"),
                "bbox": i.get("bbox"),
                "y_norm": i.get("y_norm")
            })

    return review
