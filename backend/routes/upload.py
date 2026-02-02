from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import os
import uuid
from db import finalize_bill_summary

from services.pipeline import process_bill
from db import (
    insert_bill,
    insert_bill_items,
    update_bill_summary,
    delete_bill_items
)

router = APIRouter()

UPLOAD_DIR = "uploads/bills"


# ===============================
# MODELS
# ===============================
class FinalizePayload(BaseModel):
    bill_id: int
    table: list
    final_total: float
    confidence: float


# ===============================
# UPLOAD (DRAFT OCR)
# ===============================
@router.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # 1️⃣ Insert bill shell
    bill_id = insert_bill(file_path)

    # 2️⃣ Run OCR + pipeline
    result = process_bill(file_path)

    # 3️⃣ Insert INITIAL items (draft)
    insert_bill_items(bill_id, result["table"])

    # 4️⃣ Initial totals (OCR only)
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


# ===============================
# FINALIZE (USER-CONFIRMED TRUTH)
# ===============================
@router.post("/finalize-bill")
def finalize_bill(payload: FinalizePayload):
    bill_id = payload.bill_id

    print("🟢 FINALIZING BILL:", bill_id)

    # 1️⃣ Remove old OCR items
    delete_bill_items(bill_id)

    # 2️⃣ Insert corrected items
    insert_bill_items(bill_id, payload.table)

    # 3️⃣ Update final bill summary (FULL ARGUMENTS)
    finalize_bill_summary(
        bill_id=bill_id,
        final_total=payload.final_total,
        confidence=payload.confidence
    )

    return {
        "status": "finalized",
        "bill_id": bill_id
    }
