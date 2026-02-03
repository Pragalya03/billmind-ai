import matplotlib
matplotlib.use("Agg")  # Windows + FastAPI safe

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from io import BytesIO
from db import get_db_connection
import matplotlib.pyplot as plt
import tempfile
import os

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/download")
def download_pdf(
    user_id: str = Query(...),
    start_date: str | None = None,
    end_date: str | None = None
):
    # -------------------------
    # USER ID SAFETY
    # -------------------------
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # -------------------------
    # DATE FILTER (bill_date)
    # -------------------------
    date_filter = ""
    params = [uid]

    if start_date:
        date_filter += " AND b.bill_date >= %s"
        params.append(start_date)

    if end_date:
        date_filter += " AND b.bill_date <= %s"
        params.append(end_date)

    # =========================
    # SUMMARY (bill_date)
    # =========================
    cursor.execute(
        f"""
        SELECT
            COUNT(*) AS total_bills,
            SUM(b.final_total) AS total_spend,
            AVG(b.final_total) AS avg_spend
        FROM bills b
        WHERE b.user_id = %s
          AND b.bill_date IS NOT NULL
        {date_filter}
        """,
        tuple(params)
    )
    summary = cursor.fetchone()

    # =========================
    # MONTHLY SPEND (bill_date)
    # =========================
    cursor.execute(
        f"""
        SELECT
            DATE_FORMAT(b.bill_date, '%Y-%m') AS month,
            SUM(b.final_total) AS total
        FROM bills b
        WHERE b.user_id = %s
          AND b.bill_date IS NOT NULL
        {date_filter}
        GROUP BY month
        ORDER BY month
        """,
        tuple(params)
    )
    monthly = cursor.fetchall()

    # =========================
    # STORE-WISE SPEND
    # =========================
    cursor.execute(
        f"""
        SELECT
            b.shop_name,
            SUM(b.final_total) AS total
        FROM bills b
        WHERE b.user_id = %s
          AND b.bill_date IS NOT NULL
        {date_filter}
        GROUP BY b.shop_name
        ORDER BY total DESC
        """,
        tuple(params)
    )
    stores = cursor.fetchall()

    # =========================
    # BILLS + ITEMS (bill_date)
    # =========================
    cursor.execute(
        f"""
        SELECT
            b.bill_id,
            b.shop_name,
            b.bill_date,
            b.final_total,
            i.item_name,
            i.quantity,
            i.unit_price,
            i.line_total
        FROM bills b
        LEFT JOIN bill_items i ON b.bill_id = i.bill_id
        WHERE b.user_id = %s
          AND b.bill_date IS NOT NULL
        {date_filter}
        ORDER BY b.bill_date DESC, b.bill_id
        """,
        tuple(params)
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # -------------------------
    # GROUP ITEMS BY BILL
    # -------------------------
    bills = {}
    for r in rows:
        bid = r["bill_id"]

        if bid not in bills:
            bills[bid] = {
                "bill_id": bid,
                "shop_name": r["shop_name"],
                "bill_date": r["bill_date"],
                "final_total": r["final_total"],
                "items": []
            }

        if r["item_name"]:
            bills[bid]["items"].append({
                "name": r["item_name"],
                "qty": r["quantity"],
                "unit": r["unit_price"],
                "total": r["line_total"]
            })

    # =========================
    # CHART IMAGES
    # =========================
    tmp_files = []

    def create_chart(x, y, title):
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.bar(x, y)
        ax.set_title(title)
        ax.set_ylabel("Amount (₹)")
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        plt.savefig(tmp.name)
        plt.close(fig)
        tmp_files.append(tmp.name)
        return tmp.name

    monthly_chart = create_chart(
        [m["month"] for m in monthly],
        [m["total"] for m in monthly],
        "Monthly Spend (by Bill Date)"
    )

    store_chart = create_chart(
        [s["shop_name"] or "Unknown" for s in stores],
        [s["total"] for s in stores],
        "Store-wise Spend"
    )

    # =========================
    # PDF GENERATION
    # =========================
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # -------- PAGE 1: CHARTS --------
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(2 * cm, height - 2 * cm, "BillMind AI — Spending Report")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        2 * cm,
        height - 3 * cm,
        f"Date Range: {start_date or 'Beginning'} → {end_date or 'Today'}"
    )

    pdf.drawImage(monthly_chart, 2 * cm, height - 11 * cm, width=16 * cm)
    pdf.showPage()

    pdf.drawImage(store_chart, 2 * cm, height - 11 * cm, width=16 * cm)
    pdf.showPage()

    # -------- PAGE 2: SUMMARY --------
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(2 * cm, height - 2 * cm, "Summary (Based on Bill Date)")

    pdf.setFont("Helvetica", 11)
    pdf.drawString(2 * cm, height - 4 * cm, f"Total Bills: {summary['total_bills']}")
    pdf.drawString(
        2 * cm,
        height - 5 * cm,
        f"Total Spend: ₹ {summary['total_spend'] or 0:.2f}"
    )
    pdf.drawString(
        2 * cm,
        height - 6 * cm,
        f"Average Bill: ₹ {summary['avg_spend'] or 0:.2f}"
    )

    pdf.showPage()

    # -------- BILLS + ITEMS --------
    for bill in bills.values():
        pdf.setFont("Helvetica-Bold", 13)
        pdf.drawString(
            2 * cm,
            height - 2 * cm,
            f"Bill #{bill['bill_id']} — {bill['shop_name'] or '—'}"
        )

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            2 * cm,
            height - 3 * cm,
            f"Bill Date: {bill['bill_date']}    Total: ₹ {bill['final_total']}"
        )

        y = height - 4.2 * cm
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(2 * cm, y, "Item")
        pdf.drawString(10 * cm, y, "Qty")
        pdf.drawString(12 * cm, y, "Unit")
        pdf.drawString(15 * cm, y, "Total")
        y -= 0.4 * cm

        pdf.setFont("Helvetica", 9)
        for item in bill["items"]:
            if y < 2 * cm:
                pdf.showPage()
                y = height - 2 * cm

            pdf.drawString(2 * cm, y, item["name"][:40])
            pdf.drawString(10 * cm, y, str(item["qty"]))
            pdf.drawString(12 * cm, y, f"₹ {item['unit']}")
            pdf.drawString(15 * cm, y, f"₹ {item['total']}")
            y -= 0.4 * cm

        pdf.showPage()

    pdf.save()
    buffer.seek(0)

    for f in tmp_files:
        os.unlink(f)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=billmind_report.pdf"
        }
    )
