import re
from collections import defaultdict


def extract_header(segmented_items):
    """
    Reconstruct shop name and address from HEADER-labeled tokens.
    Corrected OCR words automatically reinject because confidence is updated upstream.
    """

    # -----------------------------
    # 1️⃣ Collect HEADER tokens only
    # -----------------------------
    header_tokens = [
        i for i in segmented_items
        if i.get("label") == "HEADER"
    ]

    if not header_tokens:
        return {
            "shop_name": "",
            "address": ""
        }

    # -----------------------------
    # 2️⃣ Group tokens by line (y_norm)
    # -----------------------------
    lines = defaultdict(list)

    for token in header_tokens:
        y = round(float(token.get("y_norm", 0)), 2)
        lines[y].append(token)

    # -----------------------------
    # 3️⃣ Sort lines top → bottom
    # -----------------------------
    sorted_lines = []
    for y in sorted(lines.keys()):
        line_tokens = sorted(
            lines[y],
            key=lambda t: t["bbox"][0][0]  # x-position
        )
        line_text = " ".join(t["text"] for t in line_tokens)
        sorted_lines.append(line_text)

    # -----------------------------
    # 4️⃣ Clean junk (long digit-only strings)
    # -----------------------------
    cleaned_lines = [
        line for line in sorted_lines
        if not re.search(r"\b\d{5,}\b", line)
    ]

    if not cleaned_lines:
        return {
            "shop_name": "",
            "address": ""
        }

    # -----------------------------
    # 5️⃣ Assign semantics
    # -----------------------------
    shop_name = cleaned_lines[0]
    address = " ".join(cleaned_lines[1:]) if len(cleaned_lines) > 1 else ""

    return {
        "shop_name": shop_name.strip(),
        "address": address.strip()
    }
