from agents.product_agent import match_product


# ------------------ NEW (MINIMAL ADDITION) ------------------
TOTAL_KEYWORDS = {"total", "grand total", "amount", "sum"}

def normalize_alpha(text: str) -> str:
    text = text.lower()
    text = text.replace("0", "o")
    text = text.replace("1", "l")
    text = text.replace("|", "l")
    return text.strip()

def is_total_text(text: str) -> bool:
    return any(k in normalize_alpha(text) for k in TOTAL_KEYWORDS)
# -----------------------------------------------------------


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
        print(f"  {i['text']} | x={i['bbox'][0][0]:.1f} | y={float(i['y_norm']):.2f}")

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
                f"  {cell['text']} | x={cell['bbox'][0][0]:.1f} | y={float(cell['y_norm']):.2f}"
            )

    # -------- BUILD TABLE (NUMERIC PRIORITY LOGIC) --------
    table = []

    for row_idx, row in enumerate(rows):
        print(f"\n--- PROCESSING ROW {row_idx + 1} ---")

        row = sorted(row, key=lambda x: x["bbox"][0][0])

        item_text = None
        numbers = []

        for cell in row:
            text = cell["text"]

            # 🔥 FIX: never treat TOTAL-like text as item
            if is_total_text(text):
                print(f"⛔ Skipping TOTAL word: {text}")
                continue

            if not is_number(text) and item_text is None:
                item_text = text
                print(f"ITEM detected: {text}")

            elif is_number(text):
                value = float(clean_number(text))
                numbers.append(value)
                print(f"NUMBER detected: {value}")

        qty = None
        price = None

        if len(numbers) >= 2:
            numbers = sorted(numbers)
            qty = numbers[0]
            price = numbers[-1]
            print(f"ASSIGNED → qty={qty}, price={price}")
        elif len(numbers) == 1:
            price = numbers[0]
            print(f"ASSIGNED → price={price} (qty missing)")

        print(f"ROW RESULT → item={item_text}, qty={qty}, price={price}")

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
