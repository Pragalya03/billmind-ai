from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from db import get_db_connection
from utils.security import hash_password, verify_password
import hashlib

MAX_BIGINT = 9223372036854775807

def email_to_user_id(email: str) -> int:
    digest = hashlib.sha256(email.encode()).hexdigest()
    return int(digest, 16) % MAX_BIGINT

router = APIRouter(prefix="/auth", tags=["auth"])

# =====================
# MODELS
# =====================
class SignupPayload(BaseModel):
    email: EmailStr
    password: str

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

# =====================
# SIGNUP
# =====================
@router.post("/signup")
def signup(payload: SignupPayload):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT user_id FROM users WHERE email = %s",
        (payload.email,)
    )

    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="User already exists")
    user_id = email_to_user_id(payload.email)

    cursor.execute(
        """
        INSERT INTO users (user_id, email, password_hash)
        VALUES (%s, %s, %s)
        """,
        (user_id, payload.email, hash_password(payload.password))
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "user_id": str(user_id),
        "email": payload.email
    }

# =====================
# LOGIN
# =====================
@router.post("/login")
def login(payload: LoginPayload):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT user_id, password_hash
        FROM users
        WHERE email = %s
        """,
        (payload.email,)
    )

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=400, detail="User not registered")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password")

    return {
        "user_id": str(user["user_id"]),
        "email": payload.email
    }
