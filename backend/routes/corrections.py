# from fastapi import APIRouter
# from agents.learning_agent import learn, delete_word
# from db import save_ocr_correction

# router = APIRouter()

# @router.post("/correct")
# def correct(payload: dict):
#     original = payload.get("original")
#     corrected = payload.get("corrected")

#     if not original or not corrected:
#         return {"status": "invalid"}

#     save_ocr_correction(original, corrected)
#     learn(original, corrected)

#     return {"status": "learned"}

from fastapi import APIRouter
from pydantic import BaseModel
from db import save_ocr_correction

router = APIRouter()


class Correction(BaseModel):
    original: str
    corrected: str | None = None
    action: str | None = None


@router.post("/correct")
def correct(payload: Correction):
    if payload.action == "delete":
        save_ocr_correction(payload.original, "")
        return {"status": "deleted"}

    corrected = payload.corrected or payload.original

    save_ocr_correction(payload.original, corrected)

    return {
        "status": "learned",
        "original": payload.original,
        "corrected": corrected,
        "confidence": 1.0
    }
