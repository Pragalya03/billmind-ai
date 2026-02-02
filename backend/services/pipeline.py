from services.preprocess import preprocess_image
from services.ocr import extract_text
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

    # ----------------------------
    # 🔥 LOW-CONFIDENCE WORDS (FROM RAW OCR ONLY)
    # ----------------------------
    review_items = collect_review_items(
    raw_ocr  # ← THIS IS THE KEY
)

    # ----------------------------
    # NORMALIZATION (STRUCTURE ONLY)
    # ----------------------------
    normalized = normalize(raw_ocr)

    # ----------------------------
    # FINAL BILL CONFIDENCE
    # ----------------------------
    confidences = [i["confidence"] for i in raw_ocr]
    final_confidence = (
        round(sum(confidences) / len(confidences), 2)
        if confidences else 0.0
    )

    # ----------------------------
    # EXISTING PIPELINE
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
