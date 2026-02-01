import mysql.connector
from mysql.connector import Error

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
    
def insert_bill(image_path):
    conn = get_db_connection()
    if not conn:
        return None

    cursor = conn.cursor()

    query = """
        INSERT INTO bills (image_path)
        VALUES (%s)
    """

    cursor.execute(query, (image_path,))
    conn.commit()

    bill_id = cursor.lastrowid

    cursor.close()
    conn.close()

    return bill_id

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

def save_ocr_correction(original, corrected):
    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()

    # check if correction already exists
    cursor.execute(
        "SELECT id, frequency FROM ocr_corrections WHERE original_text=%s AND corrected_text=%s",
        (original, corrected)
    )

    row = cursor.fetchone()

    if row:
        cursor.execute(
            "UPDATE ocr_corrections SET frequency=%s WHERE id=%s",
            (row[1] + 1, row[0])
        )
    else:
        cursor.execute(
            "INSERT INTO ocr_corrections (original_text, corrected_text) VALUES (%s, %s)",
            (original, corrected)
        )

    conn.commit()
    cursor.close()
    conn.close()

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

    # map: original -> corrected
    return {r["original_text"]: r["corrected_text"] for r in rows}

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

    query = """
        UPDATE bills
        SET
            shop_name = %s,
            shop_address = %s,
            detected_total = %s,
            final_total = %s,
            final_confidence = %s
        WHERE bill_id = %s
    """

    cursor.execute(
        query,
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
