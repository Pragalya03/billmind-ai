import { useState } from "react"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function UploadPage({ onUploaded }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)

      const form = new FormData()
      form.append("file", file)

      // 🔗 LINK BILL TO USER
      form.append("user_id", user.id)

      const res = await axios.post(
        "http://localhost:8000/upload",
        form
      )

      onUploaded(res.data)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to upload bill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "60px auto" }}>
        <h2>Upload Bill</h2>
        <p className="muted">
          Upload a handwritten bill or receipt.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={loading}
          style={{ marginTop: 16 }}
        />

        {loading && (
          <p className="muted" style={{ marginTop: 12 }}>
            ⏳ Processing bill…
          </p>
        )}
      </div>
    </div>
  )
}

export default UploadPage
