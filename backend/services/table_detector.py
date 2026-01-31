import cv2
import numpy as np

def detect_table_bbox(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        15, 4
    )

    horizontal = thresh.copy()
    vertical = thresh.copy()

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))

    horizontal = cv2.morphologyEx(horizontal, cv2.MORPH_OPEN, h_kernel)
    vertical = cv2.morphologyEx(vertical, cv2.MORPH_OPEN, v_kernel)

    table_mask = cv2.add(horizontal, vertical)

    contours, _ = cv2.findContours(
        table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return None

    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)

    return (x, y, x + w, y + h)
