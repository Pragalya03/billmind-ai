import matplotlib
matplotlib.use("Agg")  # 🔥 Windows-safe backend

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
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    date_filter = ""
    params = [uid]

    if start_date:
        date_filter += " AND b.created_at >= %s"
        params.append(start_date)

    if end_date:
        date_filter += " AND b.created_at <= %s"
        params.append(end_date)

    # =========================
    # MONTHLY SPEND
    # =========================
    cursor.execute(
        f"""
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            SUM(final_total) AS total
        FROM bills
        WHERE user_id = %s
        {date_filter.replace("b.", "")}
        GROUP BY month
        ORDER BY month
        """,
        tuple(params)
    )
    monthly = cursor.fetchall()

    # =========================
    # STORE-WISE
    # =========================
    cursor.execute(
        f"""
        SELECT
            shop_name,
            SUM(final_total) AS total
        FROM bills
        WHERE user_id = %s
        {date_filter.replace("b.", "")}
        GROUP BY shop_name
        ORDER BY total DESC
        """,
        tuple(params)
    )
    stores = cursor.fetchall()

    # =========================
    # BILLS + ITEMS
    # =========================
    cursor.execute(
        f"""
        SELECT
            b.bill_id,
            b.shop_name,
            b.final_total,
            b.created_at,
            i.item_name,
            i.quantity,
            i.unit_price,
            i.line_total
        FROM bills b
        LEFT JOIN bill_items i ON b.bill_id = i.bill_id
        WHERE b.user_id = %s
        {date_filter}
        ORDER BY b.created_at DESC, b.bill_id, i.item_name
        """,
        tuple(params)
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # =========================
    # GROUP ITEMS PER BILL
    # =========================
    bills = {}
    for r in rows:
        bid = r["bill_id"]
        if bid not in bills:
            bills[bid] = {
                "shop": r["shop_name"],
                "date": r["created_at"],
                "total": r["final_total"],
                "items": []
            }

        if r["item_name"]:
            bills[bid]["items"].append({
                "name": r["item_name"],
                "qty": r["quantity"],
                "price": r["unit_price"],
                "total": r["line_total"]
            })

    # =========================
    # CHART IMAGES
    # =========================
    tmp_files = []

    def create_chart(x, y, title, xlabel):
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.bar(x, y)
        ax.set_title(title)
        ax.set_xlabel(xlabel)
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
        "Monthly Spend",
        "Month"
    )

    store_chart = create_chart(
        [s["shop_name"] or "Unknown" for s in stores],
        [s["total"] for s in stores],
        "Store-wise Spend",
        "Store"
    )

    # =========================
    # PDF GENERATION
    # =========================
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # -------- CHART PAGES --------
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(2 * cm, height - 2 * cm, "BillMind AI — Spending Report")
    pdf.drawImage(monthly_chart, 2 * cm, height - 11 * cm, width=16 * cm)
    pdf.showPage()

    pdf.drawImage(store_chart, 2 * cm, height - 11 * cm, width=16 * cm)
    pdf.showPage()

    # -------- BILLS + ITEMS --------
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(2 * cm, height - 2 * cm, "Bills & Items")

    y = height - 3.5 * cm

    for bill_id, b in bills.items():
        if y < 3 * cm:
            pdf.showPage()
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawString(2 * cm, height - 2 * cm, "Bills & Items (continued)")
            y = height - 3.5 * cm

        # Bill header
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(
            2 * cm,
            y,
            f"Bill #{bill_id} | {b['shop'] or '—'} | ₹ {b['total']} | {b['date'].strftime('%d %b %Y')}"
        )
        y -= 0.5 * cm

        # Items
        pdf.setFont("Helvetica", 9)
        for item in b["items"]:
            if y < 2 * cm:
                pdf.showPage()
                pdf.setFont("Helvetica-Bold", 14)
                pdf.drawString(2 * cm, height - 2 * cm, "Bills & Items (continued)")
                pdf.setFont("Helvetica", 9)
                y = height - 3.5 * cm

            pdf.drawString(
                2.5 * cm,
                y,
                f"• {item['name']} ({item['qty']} × {item['price']}) = ₹ {item['total']}"
            )
            y -= 0.4 * cm

        y -= 0.3 * cm  # spacing after each bill

    pdf.save()
    buffer.seek(0)

    for f in tmp_files:
        os.unlink(f)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=billmind_report.pdf"}
    )
