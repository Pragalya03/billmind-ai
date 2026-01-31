import { useState } from "react"
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
    await upload(file) // 🔥 reprocess bill
  }

  const editWord = async (original) => {
    const corrected = prompt("Correct text:", original)
    if (!corrected) return

    await axios.post("http://localhost:8000/correct", {
      original,
      corrected
    })
    await upload(file) // 🔥 reprocess bill
  }

  const updateCell = (rowIndex, field, value) => {
    const updated = structuredClone(result)
    updated.table[rowIndex][field] = Number(value)

    const r = updated.table[rowIndex]
    if (r.quantity != null && r.unit_price != null) {
      r.line_total = Number((r.quantity * r.unit_price).toFixed(2))
    }

    setResult(updated)
  }

  return (
    <div style={{ padding: 20 }}>
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
                </div>
              ))}
            </>
          )}

          {/* STORE */}
          <h3>🏪 Store</h3>
          <p>{result.header?.shop_name || "Not detected"}</p>
          <p>{result.header?.address || "Not detected"}</p>

          {/* TABLE */}
          <h3>🧾 Items</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {result.table.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.item}</td>

                  <td>
                    {row.quantity != null ? (
                      row.quantity
                    ) : (
                      <input
                        type="number"
                        placeholder="?"
                        onBlur={(e) => updateCell(idx, "quantity", e.target.value)}
                      />
                    )}
                  </td>

                  <td>
                    {row.unit_price != null ? (
                      row.unit_price
                    ) : (
                      <input
                        type="number"
                        placeholder="?"
                        onBlur={(e) => updateCell(idx, "unit_price", e.target.value)}
                      />
                    )}
                  </td>

                  <td>{row.line_total ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* FINAL CONFIDENCE */}
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
