from fastapi import APIRouter
from agents.learning_agent import learn, delete_word
from db import save_ocr_correction

router = APIRouter()

@router.post("/correct")
def correct(payload: dict):
    original = payload.get("original")
    corrected = payload.get("corrected")

    if not original or not corrected:
        return {"status": "invalid"}

    save_ocr_correction(original, corrected)
    learn(original, corrected)

    return {"status": "learned"}

