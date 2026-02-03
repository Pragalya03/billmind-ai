import matplotlib
matplotlib.use("Agg")
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
from db import get_db_connection
import matplotlib.pyplot as plt
import tempfile
import os

FONT_PATH = "assets/fonts/DejaVuSans.ttf"
pdfmetrics.registerFont(TTFont("DejaVu", FONT_PATH))

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
        date_filter += " AND b.bill_date >= %s"
        params.append(start_date)

    if end_date:
        date_filter += " AND b.bill_date <= %s"
        params.append(end_date)

    # ================= SUMMARY =================
    cursor.execute(
        f"""
        SELECT
            COUNT(*) AS total_bills,
            SUM(final_total) AS total_spend
        FROM bills b
        WHERE b.user_id = %s
          AND b.bill_date IS NOT NULL
        {date_filter}
        """,
        tuple(params)
    )
    summary = cursor.fetchone()

    # ================= MONTHLY =================
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

    # ================= BILLS + ITEMS =================
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

    bills = {}
    for r in rows:
        bid = r["bill_id"]
        bills.setdefault(
            bid,
            {
                "bill_id": bid,
                "shop": r["shop_name"] or "—",
                "date": r["bill_date"],
                "total": r["final_total"],
                "items": []
            }
        )
        if r["item_name"]:
            bills[bid]["items"].append([
                r["item_name"],
                r["quantity"],
                f"₹ {r['unit_price']}",
                f"₹ {r['line_total']}"
            ])

    # ================= CHART =================
    tmp_chart = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    tmp_chart_path = tmp_chart.name
    tmp_chart.close()  # 🔥 IMPORTANT ON WINDOWS

    plt.figure(figsize=(6, 3))
    plt.bar(
        [m["month"] for m in monthly],
        [m["total"] for m in monthly]
    )
    plt.title("Monthly Spend (Bill Date)")
    plt.tight_layout()
    plt.savefig(tmp_chart_path)
    plt.close()


    # ================= PDF =================
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    styles["Normal"].fontName = "DejaVu"
    styles["Title"].fontName = "DejaVu"
    styles["Heading3"].fontName = "DejaVu"

    story = []

    story.append(Paragraph("<b>BillMind AI — Spending Report</b>", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            f"Total Bills: {summary['total_bills']}<br/>"
            f"Total Spend: ₹ {summary['total_spend'] or 0}",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 20))
    story.append(Image(tmp_chart.name, width=400, height=200))
    story.append(PageBreak())

    # ================= BILL TABLES =================
    for bill in bills.values():
        story.append(
            Paragraph(
                f"<b>Bill #{bill['bill_id']}</b> — {bill['shop']}<br/>"
                f"Date: {bill['date']} &nbsp;&nbsp; Total: ₹ {bill['total']}",
                styles["Heading3"]
            )
        )

        table_data = [
            ["Item", "Qty", "Unit Price", "Line Total"]
        ] + bill["items"]

        table = Table(table_data, colWidths=[200, 60, 80, 80])
        table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("FONT", (0, 0), (-1, 0), "DejaVu")

            ])
        )


        story.append(Spacer(1, 10))
        story.append(table)
        story.append(Spacer(1, 30))

    doc.build(story)
    buffer.seek(0)
    try:
        os.remove(tmp_chart_path)
    except PermissionError:
        pass  # Windows file lock — safe to ignore


    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=billmind_report.pdf"
        }
    )

# =====================================================
# SINGLE BILL PDF (BillDetails page)
# =====================================================
@router.get("/bill/{bill_id}")
def download_single_bill(bill_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # -------- BILL --------
    cursor.execute(
        """
        SELECT
            bill_id,
            shop_name,
            shop_address,
            bill_date,
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

    # -------- ITEMS --------
    cursor.execute(
        """
        SELECT
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

    # -------- PDF --------
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    styles["Normal"].fontName = "DejaVu"
    styles["Title"].fontName = "DejaVu"
    styles["Heading3"].fontName = "DejaVu"

    story = []

    story.append(Paragraph("<b>Bill Details</b>", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            f"""
            <b>Store:</b> {bill["shop_name"] or "—"}<br/>
            <b>Date:</b> {bill["bill_date"]}<br/>
            <b>Total:</b> ₹ {bill["final_total"]}
            """,
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 20))

    table_data = [["Item", "Qty", "Unit Price", "Line Total"]]

    for i in items:
        table_data.append([
            i["item_name"],
            i["quantity"],
            f"₹ {i['unit_price']}",
            f"₹ {i['line_total']}"
        ])

    table = Table(table_data, colWidths=[220, 60, 80, 80])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("FONT", (0, 0), (-1, 0), "DejaVu")

        ])
    )

    story.append(table)

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=bill_{bill_id}.pdf"
        }
    )
