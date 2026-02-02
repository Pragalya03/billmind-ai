import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function DashboardPage({ onUpload, onOpenBill }) {
  const { user, isCustomer, isVendor } = useAuth()
  const [allBills, setAllBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBills = async () => {
      try {
        const res = await axios.get("http://localhost:8000/bills")
        setAllBills(res.data || [])
      } catch {
        setAllBills([])
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [])

  /**
   * 🔒 USER-SCOPED VIEW
   * If backend already sends user_id → strict filter
   * If not → fallback to all (demo-safe)
   */
  const scopedBills = useMemo(() => {
    if (!Array.isArray(allBills)) return []

    // Backend-ready path
    if (allBills.length > 0 && "user_id" in allBills[0]) {
      return allBills.filter(
        (b) => b.user_id === user.id
      )
    }

    // Fallback (until backend adds user_id)
    return allBills
  }, [allBills, user.id])

  return (
    <div className="container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <div>
          <h2>
            {isCustomer && "🧾 My Bills"}
            {isVendor && "🏪 Store Dashboard"}
          </h2>
          <p className="muted">
            {user.email} · {user.role}
          </p>
        </div>

        {isCustomer && (
          <button onClick={onUpload}>
            + Upload New Bill
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : scopedBills.length === 0 ? (
        <div className="card">
          <p className="muted">
            {isCustomer
              ? "You haven’t uploaded any bills yet."
              : "No bills available for this account."}
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
              {scopedBills.map((b) => (
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
                      {((b.final_confidence ?? 0) * 100).toFixed(0)}%
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
