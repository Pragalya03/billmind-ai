def extract_header(segmented_items):
    header_texts = [
        i["text"] for i in segmented_items
        if i["region"] == "HEADER" and i["confidence"] > 0.6
    ]

    shop_name = header_texts[0] if header_texts else ""
    address = " ".join(header_texts[1:]) if len(header_texts) > 1 else ""

    return {
        "shop_name": shop_name,
        "address": address
    }
