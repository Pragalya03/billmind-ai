import { useState, useMemo } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  // =========================
  // UPLOAD
  // =========================
  const upload = async (f) => {
    if (!f) return
    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", f)

      const res = await axios.post("http://localhost:8000/upload", form)
      setResult(res.data)
    } catch (e) {
      alert("Upload failed")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    setFile(f)
    upload(f)
  }

  // =========================
  // LOW CONFIDENCE HANDLING
  // =========================
  const removeReviewWord = (text) => {
    setResult((prev) => {
      if (!prev?.review_items) return prev

      return {
        ...prev,
        review_items: prev.review_items.filter(
          (w) => w.text !== text
        )
      }
    })
  }

  const confirmWord = async (text) => {
    await axios.post("http://localhost:8000/correct", {
      bill_id: result.bill_id,
      original: text,
      corrected: text,
      action: "confirm"
    })

    removeReviewWord(text)
  }

  const editWord = async (text) => {
    const corrected = prompt("Correct text:", text)
    if (!corrected) return

    await axios.post("http://localhost:8000/correct", {
      bill_id: result.bill_id,
      original: text,
      corrected,
      action: "edit"
    })

    removeReviewWord(text)
  }

  const deleteWord = async (text) => {
    await axios.post("http://localhost:8000/correct", {
      bill_id: result.bill_id,
      original: text,
      action: "delete"
    })

    removeReviewWord(text)
  }

  // =========================
  // TABLE EDITING
  // =========================
  const updateCell = (rowIndex, field, value) => {
    const updated = structuredClone(result)
    const num = Number(value)

    updated.table[rowIndex][field] = isNaN(num) ? null : num

    const r = updated.table[rowIndex]
    if (r.quantity != null && r.unit_price != null) {
      r.line_total = Number((r.quantity * r.unit_price).toFixed(2))
    }

    setResult(updated)
  }

  // =========================
  // FINAL TOTAL
  // =========================
  const frontendTotal = useMemo(() => {
    if (!result?.table) return 0

    const total = result.table
      .filter((r) => r.line_total != null)
      .reduce((sum, r) => sum + r.line_total, 0)

    return Number(total.toFixed(2))
  }, [result])

  // =========================
  // FINALIZE BILL
  // =========================
  const finalizeBill = async () => {
    if (!result) return

    try {
      setSaving(true)

      await axios.post("http://localhost:8000/finalize-bill", {
        bill_id: result.bill_id,
        table: result.table,
        final_total: frontendTotal,
        confidence: result.final_confidence
      })

      alert("✅ Bill saved successfully")
    } catch (err) {
      alert("❌ Failed to save bill")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📄 BillMind AI</h2>

      <input type="file" onChange={handleFile} />
      {loading && <p>⏳ Processing...</p>}

      {result && (
        <>
          {/* LOW CONFIDENCE WORDS */}
          {result.review_items?.length > 0 && (
            <>
              <h3>🧐 Confirm Low-Confidence Words</h3>

              {result.review_items.map((r, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 8,
                    padding: 6,
                    border: "1px solid #f5c2c7",
                    background: "#fff5f5"
                  }}
                >
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    {r.text} ({r.confidence.toFixed(2)})
                  </span>

                  <button onClick={() => confirmWord(r.text)}>Confirm</button>
                  <button onClick={() => editWord(r.text)}>Edit</button>
                  <button onClick={() => deleteWord(r.text)}>Delete</button>
                </div>
              ))}
            </>
          )}

          {/* STORE */}
          <h3>🏪 Store</h3>
          <p><b>Name:</b> {result.header?.shop_name || "Not detected"}</p>
          <p><b>Address:</b> {result.header?.address || "Not detected"}</p>

          {/* TABLE */}
          <h3>🧾 Items</h3>
          <table border="1" cellPadding="8" width="100%">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.table.map((row, idx) => {
                const incomplete =
                  row.quantity == null || row.unit_price == null

                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: incomplete ? "#fff3cd" : "#e6fffa"
                    }}
                  >
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
                    <td>{incomplete ? "⚠️ Needs input" : "✅ Complete"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h3>💰 Final Bill Total</h3>
          <p style={{ fontSize: 18, fontWeight: "bold" }}>
            ₹ {frontendTotal}
          </p>

          <button
            onClick={finalizeBill}
            disabled={saving}
            style={{ marginTop: 20, padding: "10px 20px", fontSize: 16 }}
          >
            {saving ? "Saving..." : "✅ Finalize & Save Bill"}
          </button>
        </>
      )}
    </div>
  )
}

export default App
