# from agents.product_agent import match_product


# TOTAL_KEYWORDS = {"total", "grand total", "amount", "sum"}


# def normalize_alpha(text: str) -> str:
#     if not text:
#         return ""
#     text = text.lower()
#     text = text.replace("0", "o")
#     text = text.replace("1", "l")
#     text = text.replace("|", "l")
#     return text.strip()


# def is_total_text(text: str) -> bool:
#     normalized = normalize_alpha(text)
#     return any(k in normalized for k in TOTAL_KEYWORDS)


# def clean_number(text):
#     return text.replace("o", "0").replace("O", "0")


# def is_number(text):
#     try:
#         float(clean_number(text))
#         return True
#     except:
#         return False


# def inside_center(word_bbox, cell_bbox, tol=5):
#     cx = (word_bbox[0][0] + word_bbox[2][0]) / 2
#     cy = (word_bbox[0][1] + word_bbox[2][1]) / 2
#     x1, y1, x2, y2 = cell_bbox

#     return (
#         x1 - tol <= cx <= x2 + tol and
#         y1 - tol <= cy <= y2 + tol
#     )


# def build_table(items, y_threshold=0.08):
#     grid = next((i.get("table_grid") for i in items if i.get("table_grid")), None)

#     print("\n--- TABLE AGENT DEBUG ---")
#     print("Grid detected:", bool(grid))

#     # 🚨 KEY FIX: do NOT filter by region when grid exists
#     if grid:
#         vlines = grid["vertical_lines"]
#         hlines = grid["horizontal_lines"]

#         print("Vertical lines:", vlines)
#         print("Horizontal lines:", hlines)

#         # build cells
#         cells = []
#         for r in range(len(hlines) - 1):
#             for c in range(len(vlines) - 1):
#                 cells.append({
#                     "row": r,
#                     "col": c,
#                     "bbox": (vlines[c], hlines[r], vlines[c+1], hlines[r+1]),
#                     "words": []
#                 })

#         print("Total cells:", len(cells))

#         # ✅ USE ALL OCR ITEMS, NOT JUST region == TABLE
#         for word in items:
#             assigned = False
#             for cell in cells:
#                 if inside_center(word["bbox"], cell["bbox"]):
#                     cell["words"].append(word)
#                     assigned = True
#                     print(
#                         f"WORD '{word['text']}' → cell (r={cell['row']}, c={cell['col']})"
#                     )
#                     break

#             if not assigned:
#                 pass  # intentionally silent

#         rows = {}
#         for cell in cells:
#             if cell["words"]:
#                 rows.setdefault(cell["row"], []).append(cell)

#         table = []

#         for r, row_cells in sorted(rows.items()):
#             data = {
#                 "item": None,
#                 "quantity": None,
#                 "unit_price": None,
#                 "line_total": None
#             }

#             print(f"\nProcessing row {r}")

#             for cell in row_cells:
#                 col = cell["col"]
#                 text = " ".join(w["text"] for w in cell["words"])

#                 print(f"  Cell col={col} text='{text}'")

#                 if col == 1 and text:
#                     data["item"] = match_product(text)

#                 elif col == 2 and is_number(text):
#                     data["quantity"] = float(clean_number(text))

#                 elif col == 3 and is_number(text):
#                     data["unit_price"] = float(clean_number(text))

#             # skip TOTAL rows
#             if data["item"] and is_total_text(data["item"]):
#                 print("⛔ Skipping TOTAL row:", data["item"])
#                 continue

#             # ✅ ALWAYS append item rows
#             if data["item"]:
#                 if data["quantity"] is not None and data["unit_price"] is not None:
#                     data["line_total"] = round(
#                         data["quantity"] * data["unit_price"], 2
#                     )
#                 else:
#                     data["line_total"] = None

#                 table.append(data)

#             print("Parsed row:", data)

#         print("\nFINAL TABLE:", table)
#         print("--- END TABLE AGENT DEBUG ---\n")

#         return table

#     # ---------------- FALLBACK ----------------
#     print("⚠️ No grid → using fallback parsing")
#     return _fallback_table(items, y_threshold)


# def _fallback_table(items, y_threshold):
#     body = [
#         i for i in items
#         if i["label"] not in ["HEADER", "ADDRESS", "TOTAL_LABEL", "TOTAL_VALUE"]
#     ]

#     rows = []
#     for item in body:
#         placed = False
#         for row in rows:
#             if abs(item["y_norm"] - row[0]["y_norm"]) < y_threshold:
#                 row.append(item)
#                 placed = True
#                 break
#         if not placed:
#             rows.append([item])

#     table = []

#     for row in rows:
#         name = None
#         nums = []

#         for c in row:
#             if not is_number(c["text"]) and name is None:
#                 name = c["text"]
#             elif is_number(c["text"]):
#                 nums.append(float(clean_number(c["text"])))

#         if name and is_total_text(name):
#             continue

#         qty = price = None
#         if len(nums) >= 2:
#             nums.sort()
#             qty, price = nums[0], nums[-1]

#         if name:
#             table.append({
#                 "item": match_product(name),
#                 "quantity": qty,
#                 "unit_price": price,
#                 "line_total": qty * price if qty and price else None
#             })

#     return table

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
