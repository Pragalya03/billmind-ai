from fastapi import APIRouter, Query, HTTPException
from db import get_db_connection

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/monthly-spend")
def monthly_spend(user_id: str = Query(...)):
    """
    Returns monthly spend for a user.
    user_id MUST be string to avoid JS bigint issues.
    """

    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection failed")

    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            SUM(final_total) AS total_spend
        FROM bills
        WHERE user_id = %s
          AND final_total IS NOT NULL
        GROUP BY month
        ORDER BY month ASC
        """,
        (uid,)
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "month": r["month"],
            "total": float(r["total_spend"] or 0)
        }
        for r in rows
    ]
