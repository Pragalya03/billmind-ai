def collect_review_items(ocr_items, threshold=0.6):
    """
    Collect low-confidence OCR words for user review.
    PURE function — no DB, no bill_id.
    """
    review = []

    for i in ocr_items:
        if i.get("confidence", 1.0) < threshold:
            review.append({
                "text": i["text"],
                "confidence": round(i["confidence"], 2)
            })

    return review
