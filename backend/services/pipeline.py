from services.preprocess import preprocess_image
from services.ocr import extract_text
from agents.ocr_normalizer import normalize
from agents.layout_agent import segment_layout
from agents.semantic_agent import semantic_label
from agents.header_agent import extract_header
from agents.table_agent import build_table
from agents.footer_agent import extract_total
from agents.validation_agent import validate

def process_bill(path):
    image, _ = preprocess_image(path)

    raw = extract_text(image)
    normalized = normalize(raw)
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
        "layout": segmented,
        "semantic": semantic
    }
