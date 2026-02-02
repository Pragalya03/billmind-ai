import { useState } from "react"
import axios from "axios"

function OCRReviewPage({ billId, reviewItems, onContinue }) {
  const [items, setItems] = useState(reviewItems)
  const [savingId, setSavingId] = useState(null)
  const [finalizing, setFinalizing] = useState(false)

  const removeItem = (text) => {
    setItems((prev) => prev.filter((i) => i.text !== text))
  }

  const confirmWord = async (item) => {
    try {
      setSavingId(item.text)

      await axios.post("http://localhost:8000/correct", {
        bill_id: billId,
        original: item.text,
        corrected: item.text,
        action: "confirm",
        label: item.label,
        bbox: item.bbox,
        y_norm: item.y_norm
      })

      removeItem(item.text)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to confirm word")
    } finally {
      setSavingId(null)
    }
  }

  const editWord = async (item) => {
    const corrected = prompt("Correct text:", item.text)
    if (!corrected) return

    try {
      setSavingId(item.text)

      await axios.post("http://localhost:8000/correct", {
        bill_id: billId,
        original: item.text,
        corrected,
        action: "edit",
        label: item.label,
        bbox: item.bbox,
        y_norm: item.y_norm
      })

      removeItem(item.text)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to edit word")
    } finally {
      setSavingId(null)
    }
  }

  const deleteWord = async (item) => {
    try {
      setSavingId(item.text)

      await axios.post("http://localhost:8000/correct", {
        bill_id: billId,
        original: item.text,
        action: "delete"
      })

      removeItem(item.text)
    } catch (err) {
      console.error(err)
      alert("❌ Failed to delete word")
    } finally {
      setSavingId(null)
    }
  }

  const handleContinue = () => {
    setFinalizing(true)

    // Small delay = intentional UX pause (feels premium)
    setTimeout(() => {
      onContinue()
    }, 400)
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 24
      }}
    >
      <h2 style={{ marginBottom: 8 }}>🧐 Review OCR Results</h2>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        These words were hard to read. Please confirm or correct them.
      </p>

      {items.length === 0 ? (
        <div
          style={{
            padding: 20,
            background: "#ecfeff",
            borderRadius: 12,
            marginBottom: 24
          }}
        >
          ✅ All low-confidence text reviewed.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#ffffff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  “{item.text}”
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#92400e",
                    marginTop: 4
                  }}
                >
                  Low confidence · {(item.confidence * 100).toFixed(0)}%
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 2
                  }}
                >
                  Context: {item.label || "—"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => confirmWord(item)}
                  disabled={savingId === item.text || finalizing}
                >
                  Confirm
                </button>

                <button
                  onClick={() => editWord(item)}
                  disabled={savingId === item.text || finalizing}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteWord(item)}
                  disabled={savingId === item.text || finalizing}
                  style={{ background: "#7f1d1d" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        <button
          onClick={handleContinue}
          disabled={items.length > 0 || finalizing}
          style={{
            padding: "10px 18px",
            fontSize: 15
          }}
        >
          {finalizing
            ? "Finalizing bill…"
            : "Continue to Final Bill →"}
        </button>
      </div>
    </div>
  )
}

export default OCRReviewPage
