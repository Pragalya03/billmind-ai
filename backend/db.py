import mysql.connector
from mysql.connector import Error


# ===============================
# CONNECTION
# ===============================
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Sbrp@9563",
            database="billmind_db"
        )
        return conn
    except Error as e:
        print("❌ Database connection error:", e)
        return None


# ===============================
# BILL INSERT
# ===============================
def insert_bill(image_path: str, user_id: int):
    print("🔥 INSERTING BILL WITH USER_ID:", user_id)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO bills (image_path, user_id)
        VALUES (%s, %s)
        """,
        (image_path, user_id)
    )

    bill_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    return bill_id


# ===============================
# BILL ITEMS
# ===============================
def insert_bill_items(bill_id, items):
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()
    query = """
        INSERT INTO bill_items
        (bill_id, item_name, quantity, unit_price, line_total, confidence)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    for item in items:
        cursor.execute(
            query,
            (
                bill_id,
                item.get("item"),
                item.get("quantity"),
                item.get("unit_price"),
                item.get("line_total"),
                item.get("confidence")
            )
        )

    conn.commit()
    cursor.close()
    conn.close()
    return True


def delete_bill_items(bill_id):
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM bill_items WHERE bill_id = %s",
        (bill_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()
    return True


# ===============================
# BILL SUMMARY (OCR STAGE)
# ===============================
def update_bill_summary(
    bill_id,
    shop_name,
    shop_address,
    detected_total,
    final_total,
    confidence
):
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE bills
        SET
            shop_name = %s,
            shop_address = %s,
            detected_total = %s,
            final_total = %s,
            final_confidence = %s
        WHERE bill_id = %s
        """,
        (
            shop_name,
            shop_address,
            detected_total,
            final_total,
            confidence,
            bill_id
        )
    )

    conn.commit()
    cursor.close()
    conn.close()
    return True


# ===============================
# FINALIZE BILL (FIXED)
# ===============================
def finalize_bill_summary(
    bill_id: int,
    bill_date,
    final_total: float,
    confidence: float
):
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE bills
        SET
            bill_date = %s,
            final_total = %s,
            confidence = %s
        WHERE bill_id = %s
        """,
        (
            bill_date,
            final_total,
            confidence,
            bill_id
        )
    )

    conn.commit()
    cursor.close()
    conn.close()
    return True


# ===============================
# OCR LEARNING
# ===============================
def save_ocr_correction(original, corrected):
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, frequency
        FROM ocr_corrections
        WHERE original_text = %s AND corrected_text = %s
        """,
        (original, corrected)
    )

    row = cursor.fetchone()

    if row:
        cursor.execute(
            "UPDATE ocr_corrections SET frequency = %s WHERE id = %s",
            (row[1] + 1, row[0])
        )
    else:
        cursor.execute(
            """
            INSERT INTO ocr_corrections (original_text, corrected_text)
            VALUES (%s, %s)
            """,
            (original, corrected)
        )

    conn.commit()
    cursor.close()
    conn.close()
    return True


def get_ocr_corrections():
    conn = get_db_connection()
    if not conn:
        return {}

    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT original_text, corrected_text FROM ocr_corrections"
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return {r["original_text"]: r["corrected_text"] for r in rows}


# ===============================
# dashboard support
# ===============================
def get_bill_path(bill_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT image_path FROM bills WHERE bill_id = %s",
        (bill_id,)
    )

    row = cursor.fetchone()
    cursor.close()
    conn.close()

    return row["image_path"] if row else None


def get_all_bills():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            bill_id,
            user_id,
            shop_name,
            final_total,
            confidence,
            created_at
        FROM bills
        ORDER BY created_at DESC
        """
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows
