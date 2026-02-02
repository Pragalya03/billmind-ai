import { useState, useMemo } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

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

  const confirmWord = async (original) => {
    await axios.post("http://localhost:8000/correct", {
      original,
      corrected: original
    })
    await upload(file)
  }

  const editWord = async (original) => {
    const corrected = prompt("Correct text:", original)
    if (!corrected) return

    await axios.post("http://localhost:8000/correct", {
      original,
      corrected
    })
    await upload(file)
  }

  const deleteWord = async (original) => {
    await axios.post("http://localhost:8000/correct", {
      original,
      action: "delete"
    })
    await upload(file)
  }

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

  // FRONTEND FINAL TOTAL (SOURCE OF TRUTH)
  const frontendTotal = useMemo(() => {
    if (!result?.table) return 0

    const total = result.table
      .filter((r) => r.line_total != null)
      .reduce((sum, r) => sum + r.line_total, 0)

    return Number(total.toFixed(2))
  }, [result])

  // ✅ FIXED FINALIZE CALL
  const finalizeBill = async () => {
    if (!result) return

    try {
      setSaving(true)

      await axios.post("http://localhost:8000/finalize-bill", {
        bill_id: result.bill_id,              // ✅ REQUIRED
        table: result.table,
        final_total: frontendTotal,
        confidence: result.final_confidence   // ✅ RENAMED
      })

      alert("✅ Bill saved successfully")
    } catch (err) {
      alert("❌ Failed to save bill")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📄 BillMind AI</h2>

      <input type="file" onChange={handleFile} />
      {loading && <p>⏳ Processing...</p>}

      {result && (
        <>
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
                      {row.quantity != null ? row.quantity : (
                        <input
                          type="number"
                          onBlur={(e) =>
                            updateCell(idx, "quantity", e.target.value)
                          }
                        />
                      )}
                    </td>
                    <td>
                      {row.unit_price != null ? row.unit_price : (
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

          {/* FINAL TOTAL */}
          <h3>💰 Final Bill Total</h3>
          <p style={{ fontSize: 18, fontWeight: "bold" }}>
            ₹ {frontendTotal}
          </p>

          {/* FINALIZE */}
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
