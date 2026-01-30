from agents.layout_utils import bbox_center

TOTAL_KEYWORDS = ["total", "amt", "amount", "sum", "grand"]

def semantic_label(ocr_items):
    # Collect Y positions to estimate page height
    y_positions = []

    for i in ocr_items:
        _, y = bbox_center(i["bbox"])
        y_positions.append(y)

    page_top = min(y_positions)
    page_bottom = max(y_positions)
    page_height = page_bottom - page_top

    labeled = []

    for i in ocr_items:
        text = i["text"].lower()
        confidence = i["confidence"]
        bbox = i["bbox"]

        x, y = bbox_center(bbox)
        y_norm = (y - page_top) / page_height  # 0 → top, 1 → bottom

        label = "UNKNOWN"

        # 1️⃣ HEADER detection
        if y_norm < 0.25:
            label = "HEADER"

        # 2️⃣ TOTAL keyword
        if any(k in text for k in TOTAL_KEYWORDS):
            label = "TOTAL_LABEL"

        # 3️⃣ Numeric values
        if text.replace(".", "").isdigit():
            if y_norm > 0.7:
                label = "TOTAL_VALUE"
            else:
                label = "PRICE"

        # 4️⃣ Item names (words near numbers in middle section)
        if text.isalpha() and 0.25 <= y_norm <= 0.7:
            label = "ITEM"

        labeled.append({
            "text": i["text"],
            "confidence": confidence,
            "bbox": bbox,
            "label": label,
            "y_norm": round(y_norm, 2)
        })

    return labeled
