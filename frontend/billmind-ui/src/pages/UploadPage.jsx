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
    <div className="container">
      <div className="card">
        <h2>Upload Bill</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
        />

        {loading && <p className="muted">Processing…</p>}
      </div>
    </div>
  )
}

export default UploadPage
