from fastapi import APIRouter, UploadFile, File
import os
import uuid
from services.pipeline import process_bill
from db import insert_bill, insert_bill_items, update_bill_summary

router = APIRouter()

UPLOAD_DIR = "uploads/bills"

@router.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 1️⃣ Insert bill
    bill_id = insert_bill(file_path)

    # 2️⃣ Run pipeline
    result = process_bill(file_path)

    # 3️⃣ Insert bill items
    insert_bill_items(bill_id, result["table"])

    # calculate final total from line items
    final_total = sum(
        item["line_total"] for item in result["table"]
        if item.get("line_total") is not None
    )

    update_bill_summary(
        bill_id=bill_id,
        shop_name=result["header"].get("shop_name"),
        shop_address=result["header"].get("address"),
        detected_total=result["marked_total"],
        final_total=final_total,
        confidence=result["final_confidence"]
    )

    return {
        "bill_id": bill_id,
        **result
    }

