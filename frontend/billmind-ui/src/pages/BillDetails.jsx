import { useEffect, useMemo, useState } from "react"
import axios from "axios"

function BillDetails({ billId, onDone }) {
  const [bill, setBill] = useState(null)
  const [draft, setDraft] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // =========================
  // LOAD BILL
  // =========================
  useEffect(() => {
    if (!billId) return

    setLoading(true)

    axios
      .get(`http://localhost:8000/bills/${billId}`)
      .then(res => {
        setBill(res.data)
        setDraft(structuredClone(res.data))
      })
      .finally(() => setLoading(false))
  }, [billId])

  // =========================
  // UNIT LOGIC
  // =========================
  const getUnit = (itemName) => {
    if (!itemName) return ""
    const name = itemName.toLowerCase()

    if (["rice", "salt"].some(k => name.includes(k))) return "kg"
    if (name.includes("milk")) return "ltr"
    if(name.includes("pepper")) return "gms"

    return ""
  }

  // =========================
  // CALCULATIONS
  // =========================
  const recalcLine = (i) =>
    Number(i?.quantity || 0) * Number(i?.unit_price || 0)

  const recalculatedTotal = useMemo(() => {
    if (!draft?.items) return 0
    return Number(
      draft.items
        .map(recalcLine)
        .reduce((sum, v) => sum + v, 0)
        .toFixed(2)
    )
  }, [draft])

  // =========================
  // EARLY RETURNS
  // =========================
  if (loading) {
    return (
      <div className="container" style={{ padding: "64px 0" }}>
        <p className="muted">Loading bill details…</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="container" style={{ padding: "64px 0" }}>
        <p className="muted">Bill not found.</p>
      </div>
    )
  }

  const data = isEditing ? draft : bill

  const detectedTotal = Number(bill.detected_total || 0)
  const calculatedTotal = isEditing
    ? recalculatedTotal
    : Number(bill.final_total || 0)

  const totalsMatch =
    detectedTotal > 0 &&
    Math.abs(detectedTotal - calculatedTotal) < 0.01

  // =========================
  // SAVE CHANGES
  // =========================
  const save = async () => {
    try {
      setSaving(true)

      await axios.put(`http://localhost:8000/bills/${billId}`, {
        shop_name: draft.shop_name,
        shop_address: draft.shop_address,
        bill_date: draft.bill_date,
        items: draft.items
      })

      setBill({
        ...draft,
        final_total: recalculatedTotal
      })

      setIsEditing(false)
    } catch (e) {
      console.error(e)
      alert("❌ Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="container" style={{ padding: "48px 0", maxWidth: 1200 }}>
      {/* TOP NAV */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={onDone} className="secondary">
          ← Back
        </button>
      </div>

      {/* HEADER */}
      <div
        style={{
          marginBottom: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end"
        }}
      >
        <div>
          <h1 style={{ marginBottom: 6 }}>
            {bill.shop_name || "Store"}
          </h1>
          <p className="muted">Bill ID · {bill.bill_id}</p>
        </div>

        {!isEditing && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button
              className="secondary"
              onClick={() =>
                window.open(
                  `http://localhost:8000/reports/bill/${bill.bill_id}`,
                  "_blank"
                )
              }
            >
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* ITEMS */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h3 style={{ margin: 0 }}>Items</h3>

          {isEditing && (
            <button
              className="secondary"
              onClick={() =>
                setDraft({
                  ...draft,
                  items: [
                    ...draft.items,
                    {
                      item_name: "",
                      quantity: 1,
                      unit_price: 0
                    }
                  ]
                })
              }
            >
              + Add item
            </button>
          )}
        </div>

        <div style={{ padding: "8px 24px 16px" }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr className="muted" style={{ textAlign: "left" }}>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th style={{ textAlign: "right" }}>Line total</th>
                {isEditing && <th />}
              </tr>
            </thead>

            <tbody>
              {data.items.map((item, idx) => {
                const unit = getUnit(item.item_name)

                return (
                  <tr key={idx}>
                    <td>
                      <input
                        disabled={!isEditing}
                        value={item.item_name}
                        onChange={e => {
                          const items = [...draft.items]
                          items[idx].item_name = e.target.value
                          setDraft({ ...draft, items })
                        }}
                      />
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          disabled={!isEditing}
                          value={item.quantity}
                          onChange={e => {
                            const items = [...draft.items]
                            items[idx].quantity = e.target.value
                            setDraft({ ...draft, items })
                          }}
                          style={{ width: 70 }}
                        />
                        {unit && (
                          <span className="muted" style={{ fontSize: 13 }}>
                            {unit}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={item.unit_price}
                        onChange={e => {
                          const items = [...draft.items]
                          items[idx].unit_price = e.target.value
                          setDraft({ ...draft, items })
                        }}
                        style={{ width: 100 }}
                      />
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 500 }}>
                      ₹ {recalcLine(item)}
                    </td>

                    {isEditing && (
                      <td>
                        <button
                          className="danger"
                          onClick={() => {
                            const items = draft.items.filter(
                              (_, i) => i !== idx
                            )
                            setDraft({ ...draft, items })
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION BAR */}
      {isEditing && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            className="secondary"
            onClick={() => {
              setDraft(structuredClone(bill))
              setIsEditing(false)
            }}
          >
            Cancel
          </button>

          <button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  )
}

export default BillDetails
