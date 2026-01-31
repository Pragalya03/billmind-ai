import easyocr
from agents.learning_agent import apply_learning

reader = easyocr.Reader(['en'], gpu=False, verbose=False)

def extract_text(image):
    results = reader.readtext(
        image,
        detail=1,
        paragraph=False,
        low_text=0.2,
        text_threshold=0.2,
        link_threshold=0.2
    )

    extracted = []

    for bbox, text, confidence in results:
        corrected_text, forced_conf = apply_learning(text.strip())

        if corrected_text is None:
            continue  # 🔥 deleted word

        extracted.append({
            "text": corrected_text,
            "confidence": forced_conf if forced_conf is not None else float(confidence),
            "bbox": bbox
        })


    return extracted
