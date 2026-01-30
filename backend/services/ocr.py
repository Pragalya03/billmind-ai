import easyocr

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
        extracted.append({
            "text": text.strip(),
            "confidence": float(confidence)
        })

    print("🟢 EASYOCR OUTPUT:", extracted)
    return extracted
