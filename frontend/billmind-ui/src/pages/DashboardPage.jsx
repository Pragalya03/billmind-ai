import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function DashboardPage({ onUpload, onOpenBill }) {
  const { user } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBills = async () => {
      try {
        const res = await axios.get("http://localhost:8000/bills")
        setBills(res.data || [])
      } catch {
        setBills([])
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [])

  // 🔒 Bills scoped to logged-in user
  const myBills = useMemo(() => {
    if (!Array.isArray(bills)) return []
    if (bills.length > 0 && "user_id" in bills[0]) {
      return bills.filter((b) => b.user_id === user.id)
    }
    return bills
  }, [bills, user.id])

  // 📊 Analytics
  const analytics = useMemo(() => {
    if (myBills.length === 0) {
      return {
        totalSpend: 0,
        billCount: 0,
        avgBill: 0,
        avgConfidence: 0
      }
    }

    const totalSpend = myBills.reduce(
      (sum, b) => sum + (b.final_total || 0),
      0
    )

    const avgBill = totalSpend / myBills.length

    const confidences = myBills
      .map((b) => b.final_confidence)
      .filter((c) => c != null)

    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((s, c) => s + c, 0) /
          confidences.length
        : 0

    return {
      totalSpend: totalSpend.toFixed(2),
      billCount: myBills.length,
      avgBill: avgBill.toFixed(2),
      avgConfidence: (avgConfidence * 100).toFixed(0)
    }
  }, [myBills])

  return (
    <div className="container">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <div>
          <h2>📊 My Dashboard</h2>
          <p className="muted">{user.email}</p>
        </div>

        <button onClick={onUpload}>+ Upload New Bill</button>
      </div>

      {/* ANALYTICS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32
        }}
      >
        <div className="card">
          <h4>Total Spend</h4>
          <p style={{ fontSize: 24 }}>₹ {analytics.totalSpend}</p>
        </div>

        <div className="card">
          <h4>Total Bills</h4>
          <p style={{ fontSize: 24 }}>{analytics.billCount}</p>
        </div>

        <div className="card">
          <h4>Avg Bill Value</h4>
          <p style={{ fontSize: 24 }}>₹ {analytics.avgBill}</p>
        </div>

        <div className="card">
          <h4>Avg OCR Confidence</h4>
          <p style={{ fontSize: 24 }}>
            {analytics.avgConfidence}%
          </p>
        </div>
      </div>

      {/* BILL LIST */}
      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : myBills.length === 0 ? (
        <div className="card">
          <p className="muted">
            You haven’t uploaded any bills yet.
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
              {myBills.map((b) => (
                <tr
                  key={b.bill_id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenBill(b.bill_id)}
                >
                  <td>{b.shop_name || "—"}</td>
                  <td>{b.created_at}</td>
                  <td>₹ {b.final_total}</td>
                  <td>
                    {((b.final_confidence ?? 0) * 100).toFixed(0)}%
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
