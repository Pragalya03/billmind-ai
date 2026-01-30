import { useState } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const upload = async (f) => {
    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", f)

      const res = await axios.post("http://localhost:8000/upload", form)
      setResult(res.data)
    } catch (e) {
      alert("Upload failed")
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
    upload(file)
  }

  const correctWord = async (original) => {
    const corrected = prompt("Correct text:", original)
    if (!corrected) return

    await axios.post("http://localhost:8000/correct", {
      original,
      corrected
    })
    upload(file)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📄 BillMind AI</h2>
      <input type="file" onChange={handleFile} />

      {loading && <p>⏳ Processing...</p>}

      {result && (
        <>
          {/* STEP 1: LOW CONFIDENCE CONFIRMATION */}
          {result.review_items?.length > 0 && (
            <>
              <h3>🧐 Confirm Low-Confidence Words</h3>
              {result.review_items.map((r, i) => (
                <div key={i}>
                  <span style={{ color: "red" }}>
                    {r.text} ({r.confidence.toFixed(2)})
                  </span>
                  <button onClick={() => confirmWord(r.text)}>Confirm</button>
                  <button onClick={() => correctWord(r.text)}>Edit</button>
                </div>
              ))}
            </>
          )}

          {/* STEP 2: HEADER */}
          <h3>🏪 Store</h3>
          <p>{result.header?.shop_name}</p>
          <p>{result.header?.address}</p>

          {/* STEP 3: TABLE */}
          <h3>🧾 Items</h3>
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {result.table?.map((r, i) => (
                <tr key={i}>
                  <td>{r.item}</td>
                  <td>{r.quantity}</td>
                  <td>{r.unit_price}</td>
                  <td>{r.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* STEP 4: TOTAL CHECK */}
          <h3>💰 Grand Total</h3>
          <p>Detected: {result.marked_total}</p>
          <p>{result.validation?.message}</p>

          <h3>📊 Final Bill Confidence</h3>
          <p style={{ fontWeight: "bold", color: result.final_confidence >= 0.85 ? "green" : "orange" }}>
            {result.final_confidence}
          </p>

        </>
        
      )}
    </div>
  )
}

export default App
