import re

def parse_bill(ocr_results):
    items = []

    for entry in ocr_results:
        text = entry["text"]
        conf = entry["confidence"]

        match = re.findall(r"([A-Za-z]+)\s+(\d+)\s+(\d+)", text)
        if match:
            name, qty, price = match[0]
            items.append({
                "item": name,
                "qty": int(qty),
                "price": float(price),
                "confidence": conf
            })

    return items
