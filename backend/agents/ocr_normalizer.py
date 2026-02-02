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

    # sort top → bottom
    ocr_items = sorted(ocr_items, key=lambda x: bbox_center(x["bbox"])[1])

    lines = []
    current = []

    # ----------------------------
    # GROUP INTO LINES
    # ----------------------------
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

    # ----------------------------
    # NORMALIZE EACH LINE
    # ----------------------------
    for line in lines:
        # left → right
        line = sorted(line, key=lambda x: bbox_center(x["bbox"])[0])

        raw_text = " ".join(t["text"] for t in line)
        cleaned_text = clean_text(raw_text)

        # average confidence
        avg_conf = sum(t["confidence"] for t in line) / len(line)

        # 🔥 APPLY LEARNED CORRECTIONS (LINE-LEVEL)
        if cleaned_text in corrections:
            final_text = corrections[cleaned_text]
            final_conf = 1.0
        else:
            final_text = cleaned_text
            final_conf = avg_conf

        # 🔥 y position (for table / header logic)
        _, y_center = bbox_center(line[0]["bbox"])

        normalized.append({
            "text": final_text,
            "confidence": round(final_conf, 2),

            # 🔥 CONTEXT (DO NOT REMOVE)
            "line_text": cleaned_text,       # before correction
            "tokens": [t["text"] for t in line],
            "bbox": line[0]["bbox"],
            "y_norm": y_center,

            # 🔥 PASS THROUGH LABEL IF EXISTS
            "label": line[0].get("label")
        })

    return normalized
