from agents.product_agent import match_product

def clean_number(text):
    return text.replace("o", "0").replace("O", "0")

def is_number(text):
    try:
        float(clean_number(text))
        return True
    except:
        return False

def build_table(semantic_items, y_threshold=0.08):
    body = [
        i for i in semantic_items
        if i["label"] not in ["HEADER", "TOTAL_LABEL", "TOTAL_VALUE"]
    ]

    print("\n--- TABLE AGENT DEBUG ---")
    print("BODY INPUT:")
    for i in body:
        print(f"  {i['text']} | y={float(i['y_norm']):.2f} | label={i['label']}")

    # -------- ROW CLUSTERING --------
    rows = []
    for item in body:
        placed = False
        for row in rows:
            if abs(item["y_norm"] - row[0]["y_norm"]) < y_threshold:
                row.append(item)
                placed = True
                break
        if not placed:
            rows.append([item])

    print("\nFORMED ROWS:")
    for idx, row in enumerate(rows):
        print(f"\nRow {idx + 1}:")
        for cell in row:
            print(
                f"  {cell['text']} | x={cell['bbox'][0][0]:.1f} "
                f"| y={float(cell['y_norm']):.2f} | label={cell['label']}"
            )

    # -------- BUILD TABLE (OPTION A) --------
    table = []

    for row in rows:
        row = sorted(row, key=lambda x: x["bbox"][0][0])

        item_text = None
        qty = None
        price = None

        for cell in row:
            text = cell["text"]

            if not is_number(text) and item_text is None:
                item_text = text
            elif is_number(text) and qty is None:
                qty = float(clean_number(text))
            elif is_number(text) and qty is not None and price is None:
                price = float(clean_number(text))

        # 🔥 KEY CHANGE: do NOT require qty & price
        if item_text:
            table.append({
                "item": match_product(item_text),
                "quantity": qty,
                "unit_price": price,
                "line_total": round(qty * price, 2)
                if qty is not None and price is not None
                else None
            })

    print("\nFINAL TABLE ROWS:")
    for r in table:
        print(r)

    print("--- END TABLE AGENT DEBUG ---\n")

    return table
