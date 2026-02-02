from fastapi import APIRouter
from pydantic import BaseModel
from db import finalize_bill_summary, delete_bill_items, insert_bill_items

router = APIRouter()

class FinalizePayload(BaseModel):
    bill_id: int
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
        final_total=payload.final_total,
        confidence=payload.confidence
    )

    return {
        "status": "finalized",
        "bill_id": bill_id
    }
