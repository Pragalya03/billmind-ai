import { useState } from "react"
import axios from "axios"

export default function OcrReview({ result, onContinue }) {
  const [reviewItems, setReviewItems] = useState(result.review_items || [])
  const [active, setActive] = useState(null)

  const labelMap = {
    HEADER: "🏪 Store name",
    ADDRESS: "📍 Address line",
    ITEM: "🧾 Item name",
    TOTAL_LABEL: "💰 Total label",
    TOTAL_VALUE: "💰 Total amount"
  }

  // --------------------------
  // API ACTIONS
  // --------------------------
  const resolve = async (payload, originalText) => {
    await axios.post("http://localhost:8000/correct", payload)

    // 🔥 REMOVE FROM UI (React-safe)
    setReviewItems((prev) =>
      prev.filter((w) => w.text !== originalText)
    )

    setActive(null)
  }

  const confirmWord = (r) =>
    resolve(
      { original: r.text, corrected: r.text, action: "confirm" },
      r.text
    )

  const editWord = (r) => {
    const corrected = prompt("Correct text:", r.text)
    if (!corrected) return

    resolve(
      { original: r.text, corrected, action: "edit" },
      r.text
    )
  }

  const deleteWord = (r) =>
    resolve(
      { original: r.text, action: "delete" },
      r.text
    )

  // --------------------------
  // BBOX DRAWING
  // --------------------------
  const drawBoxStyle = (bbox) => {
    if (!bbox) return {}

    const [p1, , p3] = bbox
    const left = p1[0]
    const top = p1[1]
    const width = p3[0] - p1[0]
    const height = p3[1] - p1[1]

    return {
      position: "absolute",
      left,
      top,
      width,
      height,
      border: "2px solid red",
      pointerEvents: "none"
    }
  }

  // --------------------------
  // UI
  // --------------------------
  return (
    <div>
      <h3>🧐 Review low-confidence words</h3>

      {reviewItems.length === 0 ? (
        <>
          <p>✅ All words reviewed.</p>
          <button onClick={onContinue}>Continue to Bill</button>
        </>
      ) : (
        <>
          {/* IMAGE PREVIEW */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <img
              src={`http://localhost:8000/${result.image_path}`}
              alt="Bill"
              style={{ maxWidth: "100%", border: "1px solid #ccc" }}
            />

            {active && (
              <div style={drawBoxStyle(active.bbox)} />
            )}
          </div>

          {/* REVIEW LIST */}
          {reviewItems.map((r, i) => (
            <div
              key={i}
              onMouseEnter={() => setActive(r)}
              onMouseLeave={() => setActive(null)}
              style={{
                marginBottom: 10,
                padding: 10,
                border: "1px solid #f5c2c7",
                background: "#fff5f5",
                borderRadius: 6
              }}
            >
              <div style={{ fontWeight: "bold", color: "#b02a37" }}>
                {r.text} ({r.confidence.toFixed(2)})
              </div>

              <div style={{ fontSize: 13, marginBottom: 6 }}>
                {labelMap[r.label] || "📄 Document text"}
              </div>

              <button onClick={() => confirmWord(r)}>Confirm</button>
              <button onClick={() => editWord(r)}>Edit</button>
              <button onClick={() => deleteWord(r)}>Delete</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
