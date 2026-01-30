from fastapi import APIRouter
from pydantic import BaseModel
from agents.learning_agent import learn

router = APIRouter()

class Correction(BaseModel):
    original: str
    corrected: str

@router.post("/correct")
def submit_correction(correction: Correction):
    learn(correction.original, correction.corrected)
    return {"status": "learned"}
