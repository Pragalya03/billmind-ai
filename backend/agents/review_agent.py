def collect_review_items(ocr_items, threshold=0.6):
    review = []

    for i in ocr_items:
        if i["confidence"] < threshold:
            review.append({
                "text": i["text"],
                "confidence": i["confidence"]
            })

    return review
