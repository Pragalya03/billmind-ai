from fastapi import APIRouter
from database import SessionLocal
from models.models import BillItem

router = APIRouter()

@router.post("/save")
def save_items(items: list):
    db = SessionLocal()

    for i in items:
        db.add(BillItem(
            item=i["text"],
            qty=1,
            price=0,
            confidence=i["confidence"]
        ))

    db.commit()
    db.close()
    return {"status": "saved"}
