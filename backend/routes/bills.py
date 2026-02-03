from fastapi import APIRouter, HTTPException
from db import get_db_connection

router = APIRouter()  # ❗ NO prefix here


# =========================
# GET ALL BILLS (DASHBOARD)
# =========================
@router.get("/bills")
def get_bills():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            bill_id,
            user_id,
            shop_name,
            final_total,
            bill_date,
            created_at
        FROM bills
        ORDER BY bill_date DESC
        """
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # 🔥 BIGINT SAFE
    for r in rows:
        if r.get("user_id") is not None:
            r["user_id"] = str(r["user_id"])

    return rows


# =========================
# GET SINGLE BILL (DETAILS)
# =========================
@router.get("/bills/{bill_id}")
def get_bill_details(bill_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            bill_id,
            shop_name,
            shop_address,
            bill_date,
            created_at,
            final_total
        FROM bills
        WHERE bill_id = %s
        """,
        (bill_id,)
    )
    bill = cursor.fetchone()

    if not bill:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Bill not found")

    cursor.execute(
        """
        SELECT
            item_id,
            item_name,
            quantity,
            unit_price,
            line_total
        FROM bill_items
        WHERE bill_id = %s
        ORDER BY item_id
        """,
        (bill_id,)
    )
    items = cursor.fetchall()

    cursor.close()
    conn.close()

    bill["items"] = items
    return bill


# =========================
# UPDATE BILL (EDIT MODE)
# =========================
@router.put("/bills/{bill_id}")
def update_bill(bill_id: int, payload: dict):
    conn = get_db_connection()
    cursor = conn.cursor()

    shop_name = payload.get("shop_name")
    shop_address = payload.get("shop_address")
    bill_date = payload.get("bill_date")
    items = payload.get("items", [])

    if not items:
        raise HTTPException(status_code=400, detail="Bill must have items")

    final_total = 0
    prepared_items = []

    for i in items:
        qty = float(i.get("quantity", 0))
        unit = float(i.get("unit_price", 0))
        line_total = qty * unit
        final_total += line_total

        prepared_items.append(
            (bill_id, i.get("item_name"), qty, unit, line_total)
        )

    try:
        cursor.execute(
            """
            UPDATE bills
            SET
                shop_name = %s,
                shop_address = %s,
                bill_date = %s,
                final_total = %s
            WHERE bill_id = %s
            """,
            (shop_name, shop_address, bill_date, final_total, bill_id)
        )

        cursor.execute(
            "DELETE FROM bill_items WHERE bill_id = %s",
            (bill_id,)
        )

        cursor.executemany(
            """
            INSERT INTO bill_items
            (bill_id, item_name, quantity, unit_price, line_total)
            VALUES (%s, %s, %s, %s, %s)
            """,
            prepared_items
        )

        conn.commit()

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

    return {"status": "updated", "final_total": final_total}
