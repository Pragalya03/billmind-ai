def detect(semantic_items):
    errors = []
    suggestions = []

    items = []
    current_item = None

    marked_total = None

    # Step 1: Identify marked total
    for s in semantic_items:
        if s["label"] == "TOTAL_VALUE":
            marked_total = float(s["text"])

    # Step 2: Build line items from middle section
    middle = [s for s in semantic_items if 0.25 < s["y_norm"] < 0.7]

    buffer = []

    for s in middle:
        if s["label"] == "ITEM":
            if buffer:
                buffer = []
            current_item = s["text"]
        elif s["label"] == "NUMBER":
            buffer.append(float(s["text"]))

            # assume qty then price
            if len(buffer) == 2 and current_item:
                qty, price = buffer
                items.append({
                    "item": current_item,
                    "qty": qty,
                    "price": price
                })
                buffer = []
                current_item = None

    # Step 3: Compute expected total
    expected_total = sum(i["qty"] * i["price"] for i in items)

    # Step 4: Validate
    if marked_total is not None:
        if abs(expected_total - marked_total) > 1:
            errors.append(
                f"Total mismatch: calculated {expected_total}, marked total {marked_total}"
            )
            suggestions.append(
                f"Calculated total based on items: {expected_total}"
            )

    return {
        "errors": errors,
        "suggestions": suggestions,
        "computed_total": expected_total,
        "marked_total": marked_total
    }
