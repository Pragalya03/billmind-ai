from collections import defaultdict
from agents.product_agent import match_product

STOPWORDS = ["total", "amt", "amount", "rate", "qty", "price"]

def is_number(text):
    try:
        float(text)
        return True
    except:
        return False

def build_table(semantic_items, y_tol=0.03):
    # consider only body-like tokens
    body = [i for i in semantic_items if i["label"] not in ["HEADER", "TOTAL_LABEL", "TOTAL_VALUE"]]

    rows = defaultdict(list)
    for i in body:
        key = round(i["y_norm"] / y_tol)
        rows[key].append(i)

    table = []

    for _, row in rows.items():
        # sort left → right
        row = sorted(row, key=lambda x: x["bbox"][0][0])

        item_parts = []
        qty = None
        price = None

        for cell in row:
            text = cell["text"]

            # ITEM: first meaningful non-numeric tokens on the left
            if not is_number(text) and text.lower() not in STOPWORDS:
                item_parts.append(text)
                continue

            # Quantity: small number near item
            if is_number(text) and qty is None:
                qty = float(text)
                continue

            # Price: next number
            if is_number(text) and qty is not None and price is None:
                price = float(text)
                break

        if item_parts and qty is not None and price is not None:
            raw_item = " ".join(item_parts)
            corrected_item = match_product(raw_item)

            table.append({
                "item": corrected_item,
                "quantity": qty,
                "unit_price": price,
                "line_total": round(qty * price, 2)
            })

    return table
