from agents.layout_utils import bbox_center

def segment_layout(ocr_items):
    ys = [bbox_center(i["bbox"])[1] for i in ocr_items]
    top = min(ys)
    bottom = max(ys)
    height = bottom - top

    segmented = []

    for i in ocr_items:
        _, y = bbox_center(i["bbox"])
        y_norm = (y - top) / height

        if y_norm < 0.25:
            region = "HEADER"
        elif y_norm > 0.75:
            region = "FOOTER"
        else:
            region = "BODY"

        segmented.append({
            **i,
            "region": region,
            "y_norm": round(y_norm, 2)
        })

    return segmented
