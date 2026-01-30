from fastapi import APIRouter, UploadFile, File
import uuid
import shutil
from services.pipeline import process_bill

router = APIRouter()

@router.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    bill_id = str(uuid.uuid4())
    path = f"uploads/{bill_id}.jpg"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return process_bill(path)
