from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
import uuid

from services.pipeline import process_bill
from db import (
    insert_bill,
    insert_bill_items,
    update_bill_summary,
    delete_bill_items,
    get_db_connection
)

router = APIRouter()

UPLOAD_DIR = "uploads/bills"


# ===============================
# UPLOAD (DRAFT OCR)
# ===============================
@router.post("/upload")
async def upload_bill(
    file: UploadFile = File(...),
    user_id: int = Form(...)
):
    user_id = int(user_id)
    # -----------------------------
    # 🔥 DEBUG: USER ID RECEIVED
    # -----------------------------
    print("🔥 UPLOAD USER_ID RECEIVED:", user_id)

    # -----------------------------
    # 🔒 HARD FK PRECHECK
    # -----------------------------
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM users WHERE user_id = %s",
        (user_id,)
    )
    exists = cursor.fetchone()
    cursor.close()
    conn.close()

    if not exists:
        # 🚫 Fail FAST before MySQL FK explodes
        raise HTTPException(
            status_code=400,
            detail=f"User does not exist: user_id={user_id}"
        )

    # -----------------------------
    # FILE SAVE
    # -----------------------------
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # -----------------------------
    # 🔗 INSERT BILL (USER-AWARE)
    # -----------------------------
    print("🔥 INSERTING BILL WITH USER_ID:", user_id)

    bill_id = insert_bill(
        image_path=file_path,
        user_id=user_id
    )

    # -----------------------------
    # OCR PIPELINE
    # -----------------------------
    result = process_bill(file_path)

    # -----------------------------
    # ITEMS (DRAFT)
    # -----------------------------
    insert_bill_items(bill_id, result["table"])

    # -----------------------------
    # INITIAL TOTAL
    # -----------------------------
    final_total = sum(
        item["line_total"]
        for item in result["table"]
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

    # -----------------------------
    # RESPONSE
    # -----------------------------
    return {
        "bill_id": bill_id,
        **result
    }
