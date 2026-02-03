import { useEffect, useState } from "react"
import axios from "axios"

function BillDetails({ billId, onBack }) {
  const [bill, setBill] = useState(null)
  const [draft, setDraft] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!billId) return

    axios
      .get(`http://localhost:8000/bills/${billId}`)
      .then(res => {
        setBill(res.data)
        setDraft(JSON.parse(JSON.stringify(res.data)))
      })
      .finally(() => setLoading(false))
  }, [billId])

  if (loading) return <p className="muted">Loading…</p>
  if (!bill) return <p className="muted">Bill not found</p>

  const data = isEditing ? draft : bill

  const recalcLine = (i) =>
    Number(i.quantity || 0) * Number(i.unit_price || 0)

  const save = async () => {
    await axios.put(`http://localhost:8000/bills/${billId}`, {
      shop_name: draft.shop_name,
      shop_address: draft.shop_address,
      bill_date: draft.bill_date,
      items: draft.items
    })

    setBill(JSON.parse(JSON.stringify(draft)))
    setIsEditing(false)
  }

  return (
    <div className="container">
      <button onClick={onBack}>← Back</button>

      <h2>🧾 Bill #{bill.bill_id}</h2>

      {/* BILL META */}
      <div className="card">
        <label>Store</label>
        <input
          disabled={!isEditing}
          value={data.shop_name || ""}
          onChange={e =>
            setDraft({ ...draft, shop_name: e.target.value })
          }
        />

        <label>Bill Date</label>
        <input
          type="date"
          disabled={!isEditing}
          value={data.bill_date || ""}
          onChange={e =>
            setDraft({ ...draft, bill_date: e.target.value })
          }
        />
      </div>

      {/* ITEMS */}
      <div className="card">
        <h3>Items</h3>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
              {isEditing && <th />}
            </tr>
          </thead>

          <tbody>
            {data.items.map((item, idx) => (
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
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={item.quantity}
                    onChange={e => {
                      const items = [...draft.items]
                      items[idx].quantity = e.target.value
                      setDraft({ ...draft, items })
                    }}
                  />
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
                  />
                </td>

                <td>₹ {recalcLine(item)}</td>

                {isEditing && (
                  <td>
                    <button
                      onClick={() => {
                        const items = draft.items.filter((_, i) => i !== idx)
                        setDraft({ ...draft, items })
                      }}
                    >
                      ❌
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {isEditing && (
          <button
            onClick={() =>
              setDraft({
                ...draft,
                items: [
                  ...draft.items,
                  { item_name: "", quantity: 1, unit_price: 0 }
                ]
              })
            }
          >
            + Add Item
          </button>
        )}
      </div>

      {/* ACTIONS */}
      <div style={{ marginTop: 16 }}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
        ) : (
          <>
            <button onClick={save}>💾 Save</button>
            <button
              onClick={() => {
                setDraft(JSON.parse(JSON.stringify(bill)))
                setIsEditing(false)
              }}
            >
              ❌ Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default BillDetails
