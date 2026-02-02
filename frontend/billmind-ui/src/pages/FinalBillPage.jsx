import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function FinalBillPage({ billId, onDone }) {
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // =========================
  // REPROCESS BILL
  // =========================
  useEffect(() => {
    const reprocessBill = async () => {
      try {
        setLoading(true)
        const res = await axios.post(
          "http://localhost:8000/reprocess",
          { bill_id: billId }
        )
        setBill(res.data)
      } catch (err) {
        console.error(err)
        alert("❌ Failed to load final bill")
      } finally {
        setLoading(false)
      }
    }

    reprocessBill()
  }, [billId])

  // =========================
  // TABLE EDITING
  // =========================
  const updateCell = (rowIndex, field, value) => {
    const updated = structuredClone(bill)
    const num = Number(value)

    updated.table[rowIndex][field] = isNaN(num) ? null : num

    const r = updated.table[rowIndex]
    if (r.quantity != null && r.unit_price != null) {
      r.line_total = Number((r.quantity * r.unit_price).toFixed(2))
    }

    setBill(updated)
  }

  // =========================
  // FINAL TOTAL
  // =========================
  const frontendTotal = useMemo(() => {
    if (!bill?.table) return 0
    return Number(
      bill.table
        .filter((r) => r.line_total != null)
        .reduce((s, r) => s + r.line_total, 0)
        .toFixed(2)
    )
  }, [bill])

  // =========================
  // PDF EXPORT
  // =========================
  const downloadPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(bill.header?.shop_name || "Store", 14, 18)

    doc.setFontSize(11)
    doc.text(bill.header?.address || "", 14, 26)

    doc.text(`Bill ID: ${billId}`, 14, 34)
    doc.text(
      `Confidence: ${(bill.final_confidence * 100).toFixed(0)}%`,
      14,
      40
    )

    autoTable(doc, {
      startY: 48,
      head: [["Item", "Qty", "Unit Price", "Total"]],
      body: bill.table.map((r) => [
        r.item,
        r.quantity ?? "",
        r.unit_price ?? "",
        r.line_total ?? ""
      ])
    })

    const finalY = doc.lastAutoTable.finalY || 60
    doc.setFontSize(14)
    doc.text(`Final Total: ₹ ${frontendTotal}`, 14, finalY + 14)

    doc.save(`Bill_${billId}.pdf`)
  }

  // =========================
  // FINALIZE
  // =========================
  const finalizeBill = async () => {
    try {
      setSaving(true)
      await axios.post("http://localhost:8000/finalize-bill", {
        bill_id: billId,
        table: bill.table,
        final_total: frontendTotal,
        confidence: bill.final_confidence
      })
      alert("✅ Bill saved successfully")
      onDone()
    } catch (err) {
      console.error(err)
      alert("❌ Failed to save bill")
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <div className="container">⏳ Finalizing bill…</div>
  }

  if (!bill) {
    return <div className="container">❌ No bill data</div>
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>{bill.header?.shop_name || "Store"}</h2>
        <p className="muted">{bill.header?.address}</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bill.table.map((row, idx) => {
              const incomplete =
                row.quantity == null || row.unit_price == null

              return (
                <tr key={idx}>
                  <td>{row.item}</td>
                  <td>
                    {row.quantity ?? (
                      <input
                        type="number"
                        onBlur={(e) =>
                          updateCell(idx, "quantity", e.target.value)
                        }
                      />
                    )}
                  </td>
                  <td>
                    {row.unit_price ?? (
                      <input
                        type="number"
                        onBlur={(e) =>
                          updateCell(idx, "unit_price", e.target.value)
                        }
                      />
                    )}
                  </td>
                  <td>{row.line_total ?? "—"}</td>
                  <td>{incomplete ? "⚠️" : "✅"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>💰 Final Total: ₹ {frontendTotal}</h3>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="secondary" onClick={downloadPDF}>
            ⬇️ Download PDF
          </button>

          <button onClick={finalizeBill} disabled={saving}>
            {saving ? "Saving…" : "Finalize & Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FinalBillPage
