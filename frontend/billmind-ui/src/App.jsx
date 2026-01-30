import { useState } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const upload = async (e) => {
    try {
      setLoading(true)
      setError(null)

      const form = new FormData()
      form.append("file", e.target.files[0])

      const res = await axios.post("http://localhost:8000/upload", form)
      console.log("BACKEND RESPONSE:", res.data)

      setResult(res.data)
    } catch (err) {
      console.error(err)
      setError("Upload or processing failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📄 Bill Processing System</h2>

      <input type="file" onChange={upload} />

      {loading && <p>⏳ Processing…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <>
          <hr />

          {/* HEADER */}
          <h3>🏪 Shop Details</h3>
          <p><b>Name:</b> {result.header?.shop_name || "Not detected"}</p>
          <p><b>Address:</b> {result.header?.address || "Not detected"}</p>

          {/* TABLE */}
          <h3>🧾 Items</h3>

          {Array.isArray(result.table) && result.table.length > 0 ? (
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {result.table.map((row, i) => (
                  <tr key={i}>
                    <td>{row.item}</td>
                    <td>{row.quantity}</td>
                    <td>{row.unit_price}</td>
                    <td>{row.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>⚠️ No table items detected</p>
          )}

          {/* TOTAL */}
          <h3>💰 Total</h3>
          <p><b>Handwritten Total:</b> {result.marked_total ?? "Not detected"}</p>

          {/* VALIDATION */}
          <h3>🧠 Validation</h3>
          <p><b>Status:</b> {result.validation?.status}</p>
          <p>{result.validation?.message}</p>
        </>
      )}
    </div>
  )
}

export default App
