from fastapi import APIRouter
from pydantic import BaseModel

from services.pipeline import process_bill
from db import get_bill_path

router = APIRouter()


class ReprocessPayload(BaseModel):
    bill_id: int


@router.post("/reprocess")
def reprocess_bill(payload: ReprocessPayload):
    bill_id = payload.bill_id

    # 1️⃣ Get original bill image path
    path = get_bill_path(bill_id)
    if not path:
        raise Exception("Bill path not found")

    # 2️⃣ Re-run pipeline (corrections auto-applied)
    result = process_bill(path)

    # 3️⃣ Return FINAL bill (no review_items needed anymore)
    result.pop("review_items", None)

    return result
