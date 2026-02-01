from db import get_db_connection

conn = get_db_connection()

if conn:
    print("✅ MySQL connected successfully")
    conn.close()
else:
    print("❌ MySQL connection failed")
