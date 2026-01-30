import { useState } from "react"
import axios from "axios"

function App() {
  const [result, setResult] = useState(null)

  const upload = async (e) => {
    const form = new FormData()
    form.append("file", e.target.files[0])

    const res = await axios.post(
      "http://localhost:8000/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    )

    setResult(res.data)
  }

  return (
    <div style={{ padding: 20 }}>
      <input type="file" onChange={upload} />

      {result && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App
