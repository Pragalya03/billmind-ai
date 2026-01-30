def structure(ocr_items):
    structured_items = []
    total = None

    buffer = []

    for entry in ocr_items:
        text = entry["text"]

        if text.lower() == "total":
            buffer = []
            continue

        if text.isdigit():
            buffer.append(int(text))
        else:
            if buffer:
                buffer = []
            current_item = text
            buffer.append(current_item)

        if len(buffer) == 3:
            item, qty, price = buffer
            structured_items.append({
                "item": item,
                "qty": qty,
                "price": price
            })
            buffer = []

    # Try detect total separately
    numbers = [int(i["text"]) for i in ocr_items if i["text"].isdigit()]
    if numbers:
        total = max(numbers)

    return structured_items, total
