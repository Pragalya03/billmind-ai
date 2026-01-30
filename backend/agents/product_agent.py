import json
import os
from difflib import get_close_matches

# Get absolute path to this file's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Navigate to backend/data/products.json safely
PRODUCT_FILE = os.path.join(BASE_DIR, "..", "data", "products.json")

with open(PRODUCT_FILE, "r", encoding="utf-8") as f:
    PRODUCT_LIST = json.load(f)

def normalize_text(text):
    return text.lower().replace(" ", "")

def match_product(text, cutoff=0.75):
    text_norm = normalize_text(text)
    products_norm = {normalize_text(p): p for p in PRODUCT_LIST}

    matches = get_close_matches(
        text_norm,
        products_norm.keys(),
        n=1,
        cutoff=cutoff
    )

    if matches:
        return products_norm[matches[0]]

    return text
