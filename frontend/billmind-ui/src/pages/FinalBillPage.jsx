import { useEffect, useMemo, useState } from "react"
import axios from "axios"

function FinalBillPage({ billId, onDone }) {
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // =========================
  // 🔁 REPROCESS BILL (FINAL)
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

    const total = bill.table
      .filter((r) => r.line_total != null)
      .reduce((sum, r) => sum + r.line_total, 0)

    return Number(total.toFixed(2))
  }, [bill])

  // =========================
  // FINALIZE BILL
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
    return (
      <div style={{ padding: 40 }}>
        <h3>⏳ Finalizing bill…</h3>
      </div>
    )
  }

  if (!bill) {
    return (
      <div style={{ padding: 40 }}>
        <h3>❌ No bill data available</h3>
      </div>
    )
  }

  // =========================
  // UI
  // =========================
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "40px auto",
        padding: 24
      }}
    >
      {/* STORE HEADER */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          marginBottom: 24
        }}
      >
        <h2>{bill.header?.shop_name || "Store name not detected"}</h2>
        <p style={{ color: "#6b7280" }}>
          {bill.header?.address || "Address not detected"}
        </p>
      </div>

      {/* ITEMS TABLE */}
      <table
        width="100%"
        cellPadding="10"
        style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          borderCollapse: "collapse",
          marginBottom: 24
        }}
      >
        <thead style={{ background: "#f3f4f6" }}>
          <tr>
            <th align="left">Item</th>
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

                <td align="center">
                  {row.quantity ?? (
                    <input
                      type="number"
                      onBlur={(e) =>
                        updateCell(idx, "quantity", e.target.value)
                      }
                    />
                  )}
                </td>

                <td align="center">
                  {row.unit_price ?? (
                    <input
                      type="number"
                      onBlur={(e) =>
                        updateCell(idx, "unit_price", e.target.value)
                      }
                    />
                  )}
                </td>

                <td align="center">
                  {row.line_total ?? "—"}
                </td>

                <td align="center">
                  {incomplete ? "⚠️ Needs input" : "✅ Complete"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>💰 Final Total: ₹ {frontendTotal}</h3>

        <button
          onClick={finalizeBill}
          disabled={saving}
          style={{ padding: "12px 22px", fontSize: 16 }}
        >
          {saving ? "Saving…" : "Finalize & Save Bill"}
        </button>
      </div>
    </div>
  )
}

export default FinalBillPage
