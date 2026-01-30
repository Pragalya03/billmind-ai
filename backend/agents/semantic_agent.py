from agents.layout_utils import bbox_center

TOTAL_WORDS = ["total", "amt", "amount", "sum", "grand"]

def semantic_label(items):
    ys = [bbox_center(i["bbox"])[1] for i in items]
    top, bottom = min(ys), max(ys)
    height = bottom - top

    labeled = []

    for i in items:
        text = i["text"]
        conf = i["confidence"]
        bbox = i["bbox"]

        _, y = bbox_center(bbox)
        y_norm = (y - top) / height

        label = "UNKNOWN"

        if any(w in text.lower() for w in TOTAL_WORDS):
            label = "TOTAL_LABEL"
        elif text.replace(".", "").isdigit():
            num = float(text)
            if y_norm > 0.7:
                label = "TOTAL_VALUE"
            elif num <= 50:
                label = "QTY"
            else:
                label = "PRICE"
        elif text.isalpha() and 0.25 < y_norm < 0.7:
            label = "ITEM"
        elif y_norm < 0.25:
            label = "HEADER"

        labeled.append({
            "text": text,
            "confidence": conf,
            "bbox": bbox,
            "label": label,
            "y_norm": round(y_norm, 2)
        })

    return labeled
