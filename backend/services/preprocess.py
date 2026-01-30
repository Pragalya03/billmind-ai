import cv2

def preprocess_image(path):
    img = cv2.imread(path)

    # Resize (EasyOCR works best ~1000px width)
    h, w, _ = img.shape
    scale = 1000 / w
    img = cv2.resize(img, (1000, int(h * scale)))

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Increase contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    return img, enhanced
