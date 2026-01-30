TOTAL_KEYWORDS = ["total", "amt", "amount", "sum", "grand"]

def extract_total(semantic_items):
    # Prefer semantic labels first
    for i in semantic_items:
        if i.get("label") == "TOTAL_VALUE":
            try:
                return float(i["text"])
            except:
                pass

    # Fallback: keyword + nearby number
    for i in semantic_items:
        if any(k in i["text"].lower() for k in TOTAL_KEYWORDS):
            # find closest number below it
            y_ref = i["y_norm"]
            candidates = [
                s for s in semantic_items
                if s.get("label") in ["PRICE", "QTY"]
                and abs(s["y_norm"] - y_ref) < 0.05
            ]
            for c in candidates:
                try:
                    return float(c["text"])
                except:
                    pass

    return None
