from fastapi import APIRouter
from agents.learning_agent import learn, delete_word

router = APIRouter()

@router.post("/correct")
def correct(payload: dict):
    if payload.get("action") == "delete":
        delete_word(payload["original"])
        return {"status": "deleted"}

    learn(payload["original"], payload["corrected"])
    return {"status": "learned"}
