from fastapi import APIRouter
from db import get_all_bills

router = APIRouter()

@router.get("/bills")
def get_bills():
    rows = get_all_bills()

    for r in rows:
        if "user_id" in r and r["user_id"] is not None:
            r["user_id"] = str(r["user_id"])  # 🔥 CRITICAL

    return rows
