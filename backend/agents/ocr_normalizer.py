from agents.layout_utils import bbox_center
from db import get_ocr_corrections
import re

def clean_text(text):
    text = text.replace("Rs.", "").replace("/-", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def normalize(ocr_items, y_thresh=15):
    # 🔥 load learned corrections
    corrections = get_ocr_corrections()

    ocr_items = sorted(ocr_items, key=lambda x: bbox_center(x["bbox"])[1])

    lines = []
    current = []

    for token in ocr_items:
        if not current:
            current.append(token)
            continue

        _, y1 = bbox_center(current[-1]["bbox"])
        _, y2 = bbox_center(token["bbox"])

        if abs(y1 - y2) < y_thresh:
            current.append(token)
        else:
            lines.append(current)
            current = [token]

    if current:
        lines.append(current)

    normalized = []

    for line in lines:
        line = sorted(line, key=lambda x: bbox_center(x["bbox"])[0])

        raw_text = " ".join(t["text"] for t in line)
        text = clean_text(raw_text)

        # 🔥 APPLY LEARNING
        if text in corrections:
            text = corrections[text]
            confidence = 1.0
        else:
            confidence = sum(t["confidence"] for t in line) / len(line)

        normalized.append({
            "text": text,
            "confidence": round(confidence, 2),
            "bbox": line[0]["bbox"]
        })

    return normalized
