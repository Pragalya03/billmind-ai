from fastapi import APIRouter
from pydantic import BaseModel
from db import save_ocr_correction

router = APIRouter()

class CorrectionPayload(BaseModel):
    original: str
    corrected: str | None = None
    action: str
    label: str | None = None
    bbox: list | None = None
    y_norm: float | None = None


@router.post("/correct")
def correct_word(payload: CorrectionPayload):
    original = payload.original
    corrected = payload.corrected or original
    action = payload.action

    print("📝 CORRECTION RECEIVED")
    print("Original:", original)
    print("Corrected:", corrected)
    print("Label:", payload.label)

    # CONFIRM / EDIT
    if action in ["confirm", "edit"]:
        save_ocr_correction(original, corrected)

        return {
            "status": "updated",
            "original": original,
            "corrected": corrected,
            "confidence": 1.0,

            # 🔥 THIS IS THE FIX
            "label": payload.label,
            "bbox": payload.bbox,
            "y_norm": payload.y_norm
        }

    # DELETE
    if action == "delete":
        return {
            "status": "deleted",
            "original": original,
            "label": payload.label
        }

    return {"status": "ignored"}
