from fastapi import APIRouter
from db import get_all_bills

router = APIRouter()

@router.get("/bills")
def list_bills():
    """
    Return all bills.
    Frontend will scope by user_id for now.
    """
    return get_all_bills()
