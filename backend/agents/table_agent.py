from agents.product_agent import match_product

def clean_number(text):
    return text.replace("o", "0").replace("O", "0")

def is_number(text):
    try:
        float(clean_number(text))
        return True
    except:
        return False


def build_table(items, y_threshold=0.08):
    table_items = [i for i in items if i.get("region") == "TABLE"]

    # Fallback if no table detected
    if not table_items:
        return _fallback_table(items, y_threshold)

    # -------- COLUMN GUIDED --------
    xs = [i["bbox"][0][0] for i in table_items]
    min_x, max_x = min(xs), max(xs)
    width = max_x - min_x

    columns = {
        "ITEM": (min_x, min_x + 0.45 * width),
        "QTY": (min_x + 0.45 * width, min_x + 0.65 * width),
        "PRICE": (min_x + 0.65 * width, max_x),
    }

    for i in table_items:
        x = i["bbox"][0][0]
        for col, (x1, x2) in columns.items():
            if x1 <= x <= x2:
                i["column"] = col

    # -------- ROW CLUSTERING --------
    rows = []
    for item in table_items:
        placed = False
        for row in rows:
            if abs(item["y_norm"] - row[0]["y_norm"]) < y_threshold:
                row.append(item)
                placed = True
                break
        if not placed:
            rows.append([item])

    table = []
    for row in rows:
        data = {"item": None, "quantity": None, "unit_price": None}

        for cell in row:
            text = cell["text"]
            col = cell.get("column")

            if col == "ITEM" and data["item"] is None:
                data["item"] = match_product(text)
            elif col == "QTY" and is_number(text):
                data["quantity"] = float(clean_number(text))
            elif col == "PRICE" and is_number(text):
                data["unit_price"] = float(clean_number(text))

        if data["item"]:
            if data["quantity"] and data["unit_price"]:
                data["line_total"] = round(
                    data["quantity"] * data["unit_price"], 2
                )
            else:
                data["line_total"] = None

            table.append(data)

    return table


# ---------------- FALLBACK ----------------
def _fallback_table(items, y_threshold):
    body = [
        i for i in items
        if i["label"] not in ["HEADER", "ADDRESS", "TOTAL_LABEL", "TOTAL_VALUE"]
    ]

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

    table = []
    for row in rows:
        nums = []
        name = None

        for c in row:
            if not is_number(c["text"]) and name is None:
                name = c["text"]
            elif is_number(c["text"]):
                nums.append(float(clean_number(c["text"])))

        qty = price = None
        if len(nums) >= 2:
            nums.sort()
            qty, price = nums[0], nums[-1]

        if name:
            table.append({
                "item": match_product(name),
                "quantity": qty,
                "unit_price": price,
                "line_total": qty * price if qty and price else None
            })

    return table
