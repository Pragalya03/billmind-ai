from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from db import (
    finalize_bill_summary,
    delete_bill_items,
    insert_bill_items
)

router = APIRouter()


class FinalizePayload(BaseModel):
    bill_id: int
    bill_date: date
    table: list
    final_total: float
    confidence: float


@router.post("/finalize-bill")
def finalize_bill(payload: FinalizePayload):
    bill_id = payload.bill_id

    delete_bill_items(bill_id)
    insert_bill_items(bill_id, payload.table)

    finalize_bill_summary(
        bill_id=bill_id,
        bill_date=payload.bill_date,   # ✅ now valid
        final_total=payload.final_total,
        confidence=payload.confidence
    )

    return {
        "status": "finalized",
        "bill_id": bill_id,
        "bill_date": payload.bill_date
    }
