import { useState, useMemo } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

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

  // 🔥 FRONTEND FINAL TOTAL (SOURCE OF TRUTH)
  const frontendTotal = useMemo(() => {
    if (!result?.table) return 0

    const total = result.table
      .filter((r) => r.line_total != null)
      .reduce((sum, r) => sum + r.line_total, 0)

    console.log("🧮 FRONTEND CALCULATED TOTAL:", total)
    return total.toFixed(2)
  }, [result])

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
                <div key={i} style={{ marginBottom: 6 }}>
                  <span style={{ color: "red" }}>
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
                      {row.quantity != null ? (
                        row.quantity
                      ) : (
                        <input
                          type="number"
                          onBlur={(e) =>
                            updateCell(idx, "quantity", e.target.value)
                          }
                        />
                      )}
                    </td>
                    <td>
                      {row.unit_price != null ? (
                        row.unit_price
                      ) : (
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

          {/* FINAL TOTAL (FRONTEND SOURCE OF TRUTH) */}
          <h3>💰 Final Bill Total</h3>
          <p style={{ fontSize: 18, fontWeight: "bold" }}>
            ₹ {frontendTotal}
          </p>

          {/* OCR CHECK */}
          <p>
            <b>Detected (OCR) Total:</b>{" "}
            {result.marked_total ?? "Not detected"}
          </p>

          {/* VALIDATION MESSAGE (FRONTEND-AWARE) */}
          {result.marked_total != null && (
            <p
              style={{
                fontWeight: "bold",
                color:
                  Math.abs(frontendTotal - result.marked_total) < 1
                    ? "green"
                    : "red"
              }}
            >
              {Math.abs(frontendTotal - result.marked_total) < 1
                ? `Final total ${frontendTotal} matches the detected handwritten total ${result.marked_total}.`
                : `Final total ${frontendTotal} does NOT match the detected handwritten total ${result.marked_total}.`}
            </p>
          )}


          {/* CONFIDENCE */}
          <h3>📊 Final Bill Confidence</h3>
          <p style={{ fontWeight: "bold" }}>
            {result.final_confidence}
          </p>
        </>
      )}
    </div>
  )
}

export default App
