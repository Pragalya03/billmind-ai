import { useState } from "react"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function UploadPage({ onUploaded }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log("🟢 FRONTEND USER_ID:", user.id, typeof user.id)

    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", file)
      form.append("user_id", user.id) // 🔥 STRING, NOT NUMBER

      const res = await axios.post(
        "http://localhost:8000/upload",
        form
      )

      onUploaded(res.data)
    } catch (e) {
      alert(
        e.response?.data?.detail || "Upload failed"
      )
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: "48px 0" }}>
      <div
        className="card"
        style={{
          maxWidth: 520,
          margin: "0 auto",
          textAlign: "center"
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Upload Bill</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Upload a photo of your handwritten or printed bill
        </p>

        <label
          style={{
            display: "block",
            padding: "32px 16px",
            border: "2px dashed #cbd5f5",
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            background: "#f8fafc",
            marginBottom: 16
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={loading}
            style={{ display: "none" }}
          />

          <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
          <div style={{ fontWeight: 500 }}>
            {loading ? "Uploading…" : "Click to select an image"}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            JPG, PNG supported
          </div>
        </label>

        {loading && (
          <p className="muted" style={{ marginTop: 8 }}>
            Processing your bill, please wait…
          </p>
        )}
      </div>
    </div>
  )
}

export default UploadPage
