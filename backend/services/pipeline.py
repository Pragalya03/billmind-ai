from services.preprocess import preprocess_image
from services.ocr import extract_text
from services.table_detector import detect_table_bbox

from agents.ocr_normalizer import normalize
from agents.layout_agent import segment_layout
from agents.semantic_agent import semantic_label
from agents.header_agent import extract_header
from agents.table_agent import build_table
from agents.footer_agent import extract_total
from agents.validation_agent import validate
from agents.review_agent import collect_review_items


def process_bill(path):
    # ----------------------------
    # Image + OCR
    # ----------------------------
    image, _ = preprocess_image(path)

    raw_ocr = extract_text(image)
    normalized = normalize(raw_ocr)

    # ----------------------------
    # LOW-CONFIDENCE WORDS
    # ----------------------------
    review_items = collect_review_items(normalized)

    # ----------------------------
    # FINAL BILL CONFIDENCE
    # ----------------------------
    confidences = [i["confidence"] for i in normalized]
    final_confidence = (
        round(sum(confidences) / len(confidences), 2)
        if confidences else 0.0
    )

    # ----------------------------
    # TABLE DETECTION (NEW)
    # ----------------------------
    table_bbox = detect_table_bbox(image)

    for item in normalized:
        x = item["bbox"][0][0]
        y = item["bbox"][0][1]

        if table_bbox:
            x1, y1, x2, y2 = table_bbox

            if x1 <= x <= x2 and y1 <= y <= y2:
                item["region"] = "TABLE"
            elif y < y1:
                item["region"] = "HEADER"
            else:
                item["region"] = "FOOTER"
        else:
            item["region"] = "UNKNOWN"

    # ----------------------------
    # EXISTING PIPELINE (UNCHANGED)
    # ----------------------------
    segmented = segment_layout(normalized)
    semantic = semantic_label(segmented)

    header = extract_header(semantic)
    table = build_table(semantic)
    marked_total = extract_total(semantic)
    validation = validate(table, marked_total)

    return {
        "header": header,
        "table": table,
        "marked_total": marked_total,
        "validation": validation,
        "final_confidence": final_confidence,
        "review_items": review_items
    }
