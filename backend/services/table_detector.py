import cv2
import numpy as np


def merge_lines(lines, threshold=25):  # 🔥 increased threshold
    if not lines:
        return []

    lines = sorted(lines)
    merged = [lines[0]]

    for l in lines[1:]:
        if abs(l - merged[-1]) <= threshold:
            merged[-1] = int((merged[-1] + l) / 2)
        else:
            merged.append(l)

    return merged


def select_logical_lines(lines, max_count):
    """
    Reduce noisy lines to logical column boundaries
    by keeping widest gaps.
    """
    if len(lines) <= max_count:
        return lines

    gaps = []
    for i in range(len(lines) - 1):
        gaps.append((lines[i+1] - lines[i], lines[i], lines[i+1]))

    # sort by gap width descending
    gaps.sort(reverse=True)

    selected = set()
    for _, a, b in gaps[:max_count - 1]:
        selected.add(a)
        selected.add(b)

    result = sorted(selected)

    # ensure boundaries
    result.insert(0, lines[0])
    result.append(lines[-1])

    return sorted(set(result))


def detect_table_grid(image):
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

    nz = cv2.countNonZero(table_mask)
    print("TABLE DETECTOR DEBUG → nonzero pixels:", nz)

    contours, _ = cv2.findContours(
        table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        print("❌ No contours found")
        return None

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    print("TABLE DETECTOR DEBUG → largest contour area:", area)

    if area < 2000:
        print("❌ Contour too small to be table")
        return None

    x, y, w, h = cv2.boundingRect(largest)

    # raw line detection
    vertical_lines = []
    horizontal_lines = []

    for cnt in contours:
        x_, y_, w_, h_ = cv2.boundingRect(cnt)
        if h_ > w_:
            vertical_lines.append(x_)
            vertical_lines.append(x_ + w_)
        else:
            horizontal_lines.append(y_)
            horizontal_lines.append(y_ + h_)

    # merge noisy strokes
    vertical_lines = merge_lines(vertical_lines)
    horizontal_lines = merge_lines(horizontal_lines)

    print("Detected vertical lines:", vertical_lines)
    print("Detected horizontal lines:", horizontal_lines)

    # 🔥 reduce to logical grid
    vertical_lines = select_logical_lines(vertical_lines, max_count=5)
    horizontal_lines = select_logical_lines(horizontal_lines, max_count=6)

    print("Merged vertical lines:", vertical_lines)
    print("Merged horizontal lines:", horizontal_lines)

    if len(vertical_lines) < 3 or len(horizontal_lines) < 3:
        print("❌ Not enough merged lines for table")
        return None

    print("✅ TABLE GRID DETECTED")

    return {
        "bbox": (x, y, x + w, y + h),
        "vertical_lines": vertical_lines,
        "horizontal_lines": horizontal_lines
    }
