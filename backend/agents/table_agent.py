from agents.product_agent import match_product


def clean_number(text):
    return text.replace("o", "0").replace("O", "0")


def is_number(text):
    try:
        float(clean_number(text))
        return True
    except:
        return False


def get_center_pixel(word, image_shape):
    bbox = word["bbox"]

    if bbox[0][0] > 1 and bbox[0][1] > 1:
        cx = (bbox[0][0] + bbox[2][0]) / 2
        cy = (bbox[0][1] + bbox[2][1]) / 2
    else:
        h, w = image_shape[:2]
        cx = ((bbox[0][0] + bbox[2][0]) / 2) * w
        cy = ((bbox[0][1] + bbox[2][1]) / 2) * h

    return cx, cy


def build_table(items):
    grid = next((i.get("table_grid") for i in items if i.get("table_grid")), None)

    print("\n--- TABLE AGENT DEBUG ---")
    print("Grid detected:", bool(grid))

    if not grid:
        print("⚠️ No grid → fallback")
        return []

    vlines = grid["vertical_lines"]
    hlines = grid["horizontal_lines"]

    print("Vertical lines:", vlines)
    print("Horizontal lines:", hlines)

    x_min = vlines[0]
    x_max = vlines[-1]

    # 🔥 SELECT TABLE WORDS BY COLUMN SPAN (NOT REGION)
    table_items = []
    for w in items:
        cx, cy = get_center_pixel(w, w["image_shape"])
        w["center"] = (cx, cy)

        if x_min <= cx <= x_max:
            table_items.append(w)

    print("TABLE ITEMS COUNT:", len(table_items))
    for w in table_items:
        print(f"TABLE WORD: '{w['text']}' center={w['center']}")

    # build cells
    cells = []
    for r in range(len(hlines) - 1):
        for c in range(len(vlines) - 1):
            cells.append({
                "row": r,
                "col": c,
                "bbox": (vlines[c], hlines[r], vlines[c+1], hlines[r+1]),
                "words": []
            })

    print("Total cells:", len(cells))

    # assign words to cells
    for word in table_items:
        placed = False
        cx, cy = word["center"]

        for cell in cells:
            x1, y1, x2, y2 = cell["bbox"]
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                cell["words"].append(word)
                placed = True
                print(
                    f"WORD '{word['text']}' → cell r={cell['row']} c={cell['col']}"
                )
                break

        if not placed:
            print(f"❌ WORD '{word['text']}' not inside any cell")

    # group rows
    rows = {}
    for cell in cells:
        if cell["words"]:
            rows.setdefault(cell["row"], []).append(cell)

    table = []

    for r, row_cells in sorted(rows.items()):
        row_data = {
            "item": None,
            "quantity": None,
            "unit_price": None,
            "line_total": None
        }

        print(f"\n--- ROW {r} ---")

        for cell in row_cells:
            col = cell["col"]
            text = " ".join(w["text"] for w in cell["words"])

            print(f"Cell col={col} text='{text}'")

            if col == 1:
                row_data["item"] = match_product(text)
            elif col == 2 and is_number(text):
                row_data["quantity"] = float(clean_number(text))
            elif col == 3 and is_number(text):
                row_data["unit_price"] = float(clean_number(text))

        if row_data["item"]:
            if row_data["quantity"] and row_data["unit_price"]:
                row_data["line_total"] = round(
                    row_data["quantity"] * row_data["unit_price"], 2
                )
            table.append(row_data)

        print("Parsed row:", row_data)

    print("\nFINAL TABLE:", table)
    print("--- END TABLE AGENT DEBUG ---\n")

    return table
