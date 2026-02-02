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
        console.log("📦 RAW /bills RESPONSE:", res.data)
        setBills(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error("❌ Failed to load bills", e)
        setBills([])
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [])

  // 🔥 SAFE USER ID
  const userId = user?.id ? String(user.id) : null

  // 🔥 SAFE FILTER WITH LOGGING
  const myBills = useMemo(() => {
    if (!userId) {
      console.warn("⚠️ No userId yet")
      return []
    }

    const filtered = bills.filter((b) => {
      const billUserId = String(b.user_id)
      const match = billUserId === userId

      if (!match) {
        console.warn(
          "🚫 BILL FILTERED OUT",
          "bill.user_id =", billUserId,
          "user.id =", userId
        )
      }

      return match
    })

    console.log("✅ MY BILLS:", filtered)
    return filtered
  }, [bills, userId])

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
        <div>
          <h2>📊 My Dashboard</h2>
          <p className="muted">
            Logged in as: {user?.email}
          </p>
          <p className="muted">
            User ID (session): {userId}
          </p>
        </div>

        <button onClick={onUpload}>+ Upload New Bill</button>
      </div>

      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : bills.length === 0 ? (
        <div className="card">
          <p className="muted">
            No bills returned from backend.
          </p>
        </div>
      ) : myBills.length === 0 ? (
        <div className="card">
          <p className="muted">
            Bills exist, but none match your user.
          </p>
          <p className="muted">
            Open DevTools → Console for details.
          </p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Store</th>
                <th>User ID</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {myBills.map((b) => (
                <tr
                  key={b.bill_id}
                  onClick={() => onOpenBill(b.bill_id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{b.bill_id}</td>
                  <td>{b.shop_name || "—"}</td>
                  <td>{String(b.user_id)}</td>
                  <td>₹ {b.final_total}</td>
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
