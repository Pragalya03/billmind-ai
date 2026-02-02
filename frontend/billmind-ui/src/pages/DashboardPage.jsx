import { useEffect, useState } from "react"
import axios from "axios"

function DashboardPage({ onUpload, onOpenBill }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBills = async () => {
      try {
        const res = await axios.get("http://localhost:8000/bills")
        setBills(res.data)
      } catch {
        setBills([])
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [])

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <h2>📊 Bill History</h2>
        <button onClick={onUpload}>+ Upload New Bill</button>
      </div>

      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : bills.length === 0 ? (
        <div className="card">
          <p className="muted">
            No bills yet. Upload your first bill.
          </p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>Date</th>
                <th>Total</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr
                  key={b.bill_id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenBill(b.bill_id)}
                >
                  <td>{b.shop_name || "—"}</td>
                  <td>{b.created_at}</td>
                  <td>₹ {b.final_total}</td>
                  <td>
                    <span className="badge ok">
                      {(b.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
