from doctr.io import DocumentFile
from doctr.models import ocr_predictor


# Load once (IMPORTANT for speed)
model = ocr_predictor(
    det_arch="db_resnet50",
    reco_arch="crnn_vgg16_bn",
    pretrained=True
)


def parse_with_doctr(image_path):
    doc = DocumentFile.from_images(image_path)
    result = model(doc)

    pages = []

    for page in result.pages:
        page_data = {
            "blocks": [],
            "tables": []
        }

        for block in page.blocks:
            block_data = {
                "bbox": block.geometry,
                "lines": []
            }

            for line in block.lines:
                words = [
                    {
                        "text": w.value,
                        "confidence": float(w.confidence),
                        "bbox": w.geometry
                    }
                    for w in line.words
                ]

                block_data["lines"].append(words)

            page_data["blocks"].append(block_data)

        # 🔥 TABLE EXTRACTION (KEY PART)
        if hasattr(page, "tables"):
            for table in page.tables:
                rows = []
                for row in table.cells:
                    rows.append([
                        cell.value if cell.value else ""
                        for cell in row
                    ])

                page_data["tables"].append(rows)

        pages.append(page_data)

    return pages
