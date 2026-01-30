import { useState } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const upload = async (e) => {
    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", e.target.files[0])

      const res = await axios.post(
        "http://localhost:8000/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      setResult(res.data)
    } catch (err) {
      alert("Upload failed. Check backend.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const correct = async (original, corrected) => {
    try {
      await axios.post("http://localhost:8000/correct", {
        original,
        corrected
      })
      alert("Correction learned! Re-upload to see improvement.")
    } catch (err) {
      alert("Correction failed.")
    }
  }

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>📄 BillMind AI – Handwritten Bill Processor</h2>

      <input type="file" onChange={upload} />

      {loading && <p>⏳ Processing bill...</p>}

      {result && (
        <>
          <hr />

          {/* Workflow Decision */}
          <h3>
            🧠 Workflow Decision:{" "}
            <span style={{ color: "blue" }}>{result.decision}</span>
          </h3>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div style={{ color: "orange" }}>
              <h4>⚠️ Detected Issues</h4>
              {result.errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          {/* OCR Results */}
          <h4>🔍 OCR Extracted Text</h4>

          {result.items.map((i, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 8,
                padding: 6,
                borderBottom: "1px solid #ddd"
              }}
            >
              <span
                style={{
                  color: i.confidence < 0.7 ? "red" : "black",
                  fontWeight: i.confidence < 0.7 ? "bold" : "normal"
                }}
              >
                {i.text} ({i.confidence.toFixed(2)})
              </span>

              {i.confidence < 0.7 && (
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => {
                    const c = prompt("Correct text:", i.text)
                    if (c) correct(i.text, c)
                  }}
                >
                  Correct
                </button>
              )}
            </div>
          ))}

          {/* Confidence */}
          <p>
            📊 Average Confidence:{" "}
            <b>{result.confidence.toFixed(2)}</b>
          </p>
        </>
      )}
    </div>
  )
}

export default App
