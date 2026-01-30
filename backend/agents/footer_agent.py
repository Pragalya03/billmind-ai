TOTAL_KEYWORDS = ["total", "amt", "amount", "sum"]

def extract_total(segmented_items):
    footer = [i for i in segmented_items if i["region"] == "FOOTER"]

    for i in footer:
        if any(k in i["text"].lower() for k in TOTAL_KEYWORDS):
            continue
        if i["text"].replace(".", "").isdigit():
            return float(i["text"])

    return None
