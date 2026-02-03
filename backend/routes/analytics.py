from fastapi import APIRouter, Query, HTTPException
from db import get_db_connection

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ===============================
# MONTHLY SPEND (BY bill_date)
# ===============================
@router.get("/monthly-spend")
def monthly_spend(user_id: str = Query(...)):
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            DATE_FORMAT(bill_date, '%Y-%m') AS month,
            SUM(final_total) AS total
        FROM bills
        WHERE user_id = %s
          AND bill_date IS NOT NULL
        GROUP BY month
        ORDER BY month
        """,
        (uid,)
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "month": r["month"],
            "total": float(r["total"] or 0)
        }
        for r in rows
    ]
