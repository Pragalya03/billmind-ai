def build_table(segmented_items):
    body = [i for i in segmented_items if i["region"] == "BODY"]

    rows = []
    current_item = None
    numbers = []

    for i in body:
        text = i["text"]

        if text.isalpha():
            current_item = text
            numbers = []
        elif text.replace(".", "").isdigit():
            numbers.append(float(text))

        if current_item and len(numbers) == 2:
            qty, price = numbers
            rows.append({
                "item": current_item,
                "quantity": qty,
                "unit_price": price,
                "line_total": qty * price
            })
            current_item = None
            numbers = []

    return rows
