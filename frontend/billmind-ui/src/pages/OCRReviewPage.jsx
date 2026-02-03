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
    <div className="container" style={{ padding: "40px 0", maxWidth: 900 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 6 }}>Review flagged text</h2>
        <p className="muted">
          We only show words the AI is unsure about. Most bills have very few.
        </p>
      </div>

      {/* CONTENT */}
      {items.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 32,
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <h3 style={{ marginBottom: 6 }}>All set</h3>
          <p className="muted">
            There’s nothing left to review. Your bill is ready.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 20,
                border: "1px solid #e5e7eb"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 24,
                  alignItems: "center"
                }}
              >
                {/* TEXT */}
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 6
                    }}
                  >
                    {item.text}
                  </div>

                  <div
                    className="muted"
                    style={{ fontSize: 13, marginBottom: 6 }}
                  >
                    Confidence {(item.confidence * 100).toFixed(0)}%
                  </div>

                  <p className="muted" style={{ fontSize: 14 }}>
                    {explainLowConfidence(item)}
                  </p>

                  {item.label && (
                    <p className="muted" style={{ fontSize: 12 }}>
                      Context: {item.label}
                    </p>
                  )}
                </div>

                {/* ACTIONS */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center"
                  }}
                >
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
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        <button
          disabled={items.length > 0 || finalizing}
          onClick={() => {
            setFinalizing(true)
            setTimeout(onContinue, 400)
          }}
          style={{
            padding: "12px 20px",
            fontWeight: 500
          }}
        >
          {finalizing ? "Finalizing…" : "Continue →"}
        </button>
      </div>
    </div>
  )
}

export default OCRReviewPage
