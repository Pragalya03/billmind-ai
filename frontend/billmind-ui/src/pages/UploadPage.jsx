import { useState } from "react"
import axios from "axios"

function UploadPage({ onUploaded }) {
  const [loading, setLoading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", file)

      const res = await axios.post(
        "http://localhost:8000/upload",
        form
      )

      onUploaded(res.data)
    } catch (err) {
      alert("❌ Upload failed")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: 24,
        background: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        textAlign: "center"
      }}
    >
      <h2 style={{ marginBottom: 8 }}>📄 BillMind AI</h2>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Upload a handwritten bill or receipt
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={loading}
      />

      {loading && (
        <p style={{ marginTop: 16 }}>
          🧠 Reading handwriting…
        </p>
      )}
    </div>
  )
}

export default UploadPage
