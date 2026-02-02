import { useState } from "react"
import axios from "axios"
import { explainLowConfidence } from "../utils/confidenceExplain"

function OCRReviewPage({ billId, reviewItems, onContinue }) {
  const [items, setItems] = useState(reviewItems)
  const [savingId, setSavingId] = useState(null)
  const [finalizing, setFinalizing] = useState(false)

  const removeItem = (text) =>
    setItems((prev) => prev.filter((i) => i.text !== text))

  const sendCorrection = async (payload, text) => {
    try {
      setSavingId(text)
      await axios.post("http://localhost:8000/correct", payload)
      removeItem(text)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to save correction")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="container">
      <h2>Review OCR Results</h2>
      <p className="muted">
        BillMind AI flagged these words because it was unsure about them.
      </p>

      {items.length === 0 ? (
        <div className="card" style={{ background: "var(--success-bg)" }}>
          ✅ All low-confidence text reviewed.
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} className="card" style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20
              }}
            >
              <div>
                <strong>“{item.text}”</strong>

                <div className="badge warn" style={{ marginTop: 6 }}>
                  Low confidence · {(item.confidence * 100).toFixed(0)}%
                </div>

                <p className="muted" style={{ marginTop: 6 }}>
                  {explainLowConfidence(item)}
                </p>

                <p className="muted" style={{ fontSize: 12 }}>
                  Context: {item.label || "—"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={finalizing || savingId === item.text}
                  onClick={() =>
                    sendCorrection(
                      {
                        bill_id: billId,
                        original: item.text,
                        corrected: item.text,
                        action: "confirm"
                      },
                      item.text
                    )
                  }
                >
                  Confirm
                </button>

                <button
                  className="secondary"
                  disabled={finalizing || savingId === item.text}
                  onClick={() => {
                    const corrected = prompt("Correct text:", item.text)
                    if (!corrected) return
                    sendCorrection(
                      {
                        bill_id: billId,
                        original: item.text,
                        corrected,
                        action: "edit"
                      },
                      item.text
                    )
                  }}
                >
                  Edit
                </button>

                <button
                  className="danger"
                  disabled={finalizing || savingId === item.text}
                  onClick={() =>
                    sendCorrection(
                      {
                        bill_id: billId,
                        original: item.text,
                        action: "delete"
                      },
                      item.text
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, textAlign: "right" }}>
        <button
          disabled={items.length > 0 || finalizing}
          onClick={() => {
            setFinalizing(true)
            setTimeout(onContinue, 400)
          }}
        >
          {finalizing ? "Finalizing…" : "Continue to Final Bill →"}
        </button>
      </div>
    </div>
  )
}

export default OCRReviewPage
