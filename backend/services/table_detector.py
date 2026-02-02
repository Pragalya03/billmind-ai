# import cv2
# import numpy as np


# def detect_table_grid(image):
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

#     # 🔹 softer threshold (IMPORTANT)
#     thresh = cv2.adaptiveThreshold(
#         gray, 255,
#         cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
#         cv2.THRESH_BINARY_INV,
#         25, 8
#     )

#     # 🔹 detect horizontal lines
#     horizontal = thresh.copy()
#     h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 1))
#     horizontal = cv2.morphologyEx(horizontal, cv2.MORPH_OPEN, h_kernel)

#     # 🔹 detect vertical lines
#     vertical = thresh.copy()
#     v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 30))
#     vertical = cv2.morphologyEx(vertical, cv2.MORPH_OPEN, v_kernel)

#     # 🔹 combine
#     table_mask = cv2.add(horizontal, vertical)

#     # 🔹 DEBUG: count non-zero pixels
#     nz = cv2.countNonZero(table_mask)
#     print("TABLE DETECTOR DEBUG → nonzero pixels:", nz)

#     if nz < 500:
#         print("❌ Table lines too weak → grid not detected")
#         return None

#     contours, _ = cv2.findContours(
#         table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
#     )

#     if not contours:
#         print("❌ No contours found")
#         return None

#     largest = max(contours, key=cv2.contourArea)
#     area = cv2.contourArea(largest)
#     print("TABLE DETECTOR DEBUG → largest contour area:", area)

#     if area < 2000:
#         print("❌ Contour too small to be table")
#         return None

#     x, y, w, h = cv2.boundingRect(largest)

#     # ---------------- LINE EXTRACTION ----------------
#     vertical_lines = []
#     horizontal_lines = []

#     for cnt in contours:
#         x0, y0, w0, h0 = cv2.boundingRect(cnt)

#         if h0 > w0 * 2:   # vertical-ish
#             vertical_lines.append(x0)

#         elif w0 > h0 * 2: # horizontal-ish
#             horizontal_lines.append(y0)

#     # include edges
#     vertical_lines = sorted(set(vertical_lines + [x, x + w]))
#     horizontal_lines = sorted(set(horizontal_lines + [y, y + h]))

#     print("Detected vertical lines:", vertical_lines)
#     print("Detected horizontal lines:", horizontal_lines)

#     # sanity check
#     if len(vertical_lines) < 3 or len(horizontal_lines) < 3:
#         print("❌ Not enough lines for grid")
#         return None

#     print("✅ TABLE GRID DETECTED")

#     return {
#         "bbox": (x, y, x + w, y + h),
#         "vertical_lines": vertical_lines,
#         "horizontal_lines": horizontal_lines
#     }
