from collections import defaultdict

def build_table(semantic_items, y_tol=0.03):
    body = [i for i in semantic_items if i["label"] in ["ITEM", "QTY", "PRICE"]]

    rows = defaultdict(list)
    for i in body:
        key = round(i["y_norm"] / y_tol)
        rows[key].append(i)

    table = []

    for _, row in rows.items():
        item = None
        qty = None
        price = None

        row = sorted(row, key=lambda x: x["label"])

        for cell in row:
            if cell["label"] == "ITEM":
                item = cell["text"]
            elif cell["label"] == "QTY":
                qty = float(cell["text"])
            elif cell["label"] == "PRICE":
                price = float(cell["text"])

        if item and qty and price:
            table.append({
                "item": item,
                "quantity": qty,
                "unit_price": price,
                "line_total": qty * price
            })

    return table
