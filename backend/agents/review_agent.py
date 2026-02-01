def collect_review_items(ocr_items, threshold=0.6):
    review = []

    for i in ocr_items:
        # 🔥 skip words auto-corrected from learning DB
        if i.get("auto_corrected"):
            continue

        # normal low-confidence review
        if i.get("confidence", 1.0) < threshold:
            review.append({
                "text": i["text"],
                "confidence": i["confidence"]
            })

    return review
