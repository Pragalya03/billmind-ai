from db import get_ocr_corrections


def clean_text(text: str) -> str:
    """
    Basic OCR cleanup.
    Keep this EVEN if OCR improves.
    """
    if not text:
        return text

    # common handwritten OCR mistakes
    text = text.replace("O", "0").replace("o", "0")
    text = text.replace(",", "").strip()

    return text


def normalize(items):
    """
    Normalize OCR output + auto-apply learned corrections.
    """
    corrections = get_ocr_corrections()
    normalized = []

    for item in items:
        original_text = item["text"]

        # -------------------------
        # 1️⃣ Base cleanup (existing behavior)
        # -------------------------
        cleaned = clean_text(original_text)
        item["text"] = cleaned

        # -------------------------
        # 2️⃣ Apply learned correction (NEW)
        # -------------------------
        if cleaned in corrections:
            item["text"] = corrections[cleaned]
            item["confidence"] = 1.0
            item["auto_corrected"] = True
        else:
            item["auto_corrected"] = False

        normalized.append(item)

    return normalized
