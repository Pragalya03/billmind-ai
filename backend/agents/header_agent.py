import re

def extract_header(segmented_items):
    header = [
        i["text"] for i in segmented_items
        if i["label"] == "HEADER" and i["confidence"] > 0.6
    ]

    header = [h for h in header if not re.search(r"\d{5,}", h)]

    shop_name = header[0] if header else ""
    address = " ".join(header[1:]) if len(header) > 1 else ""

    return {
        "shop_name": shop_name,
        "address": address
    }
