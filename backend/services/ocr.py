import easyocr
from agents.learning_agent import apply_learning

# Initialize EasyOCR reader once (important for performance)
reader = easyocr.Reader(
    ['en'],
    gpu=False,
    verbose=False
)

def extract_text(image):
    results = reader.readtext(
        image,
        detail=1,
        paragraph=False,
        text_threshold=0.4,
        low_text=0.3,
        link_threshold=0.4
    )

    extracted = []

    for bbox, text, confidence in results:
        cleaned_text = text.strip()

        # Apply user-assisted learning (self-improving behavior)
        learned_text = apply_learning(cleaned_text)

        extracted.append({
            "text": learned_text,
            "confidence": float(confidence)
        })

    print("🟢 EASYOCR OUTPUT:", extracted)
    return extracted
