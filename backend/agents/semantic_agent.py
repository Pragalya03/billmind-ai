from agents.layout_utils import bbox_center

TOTAL_KEYWORDS = ["total", "amt", "amount", "sum", "grand"]


def semantic_label(ocr_items):
    y_positions = [bbox_center(i["bbox"])[1] for i in ocr_items]
    page_top = min(y_positions)
    page_bottom = max(y_positions)
    page_height = page_bottom - page_top

    semantic = []

    for i in ocr_items:
        text = i["text"]
        conf = i["confidence"]
        bbox = i["bbox"]

        _, y = bbox_center(bbox)
        y_norm = (y - page_top) / page_height

        label = "UNKNOWN"

        if any(k in text.lower() for k in TOTAL_KEYWORDS):
            label = "TOTAL_LABEL"
        elif text.replace(".", "").isdigit():
            if y_norm > 0.7:
                label = "TOTAL_VALUE"
            else:
                label = "NUMBER"
        elif text.isalpha() and 0.25 < y_norm < 0.7:
            label = "ITEM"

        semantic.append({
            "text": text,
            "confidence": conf,
            "bbox": bbox,
            "label": label,
            "y_norm": round(y_norm, 2)
        })

    return semantic
