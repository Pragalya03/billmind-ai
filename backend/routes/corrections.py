from fastapi import APIRouter
from pydantic import BaseModel

from db import save_ocr_correction

router = APIRouter()

# ==========================
# REQUEST MODEL
# ==========================
class CorrectionPayload(BaseModel):
    original: str
    corrected: str | None = None
    action: str               # confirm | edit | delete

    # 🔥 CONTEXT (OPTIONAL BUT IMPORTANT)
    label: str | None = None
    bbox: list | None = None
    y_norm: float | None = None


# ==========================
# CORRECTION ENDPOINT
# ==========================
@router.post("/correct")
def correct_word(payload: CorrectionPayload):
    original = payload.original
    corrected = payload.corrected or original
    action = payload.action

    print("📝 CORRECTION RECEIVED")
    print("Original:", original)
    print("Corrected:", corrected)
    print("Action:", action)
    print("Label:", payload.label)

    # --------------------------
    # CONFIRM / EDIT
    # --------------------------
    if action in ["confirm", "edit"]:
        # Store learning so future OCR fixes automatically
        save_ocr_correction(original, corrected)

        return {
            "status": "updated",
            "original": original,
            "corrected": corrected,
            "confidence": 1.0,

            # 🔥 SEND CONTEXT BACK
            "label": payload.label,
            "bbox": payload.bbox,
            "y_norm": payload.y_norm
        }

    # --------------------------
    # DELETE
    # --------------------------
    if action == "delete":
        return {
            "status": "deleted",
            "original": original
        }

    return {"status": "ignored"}
