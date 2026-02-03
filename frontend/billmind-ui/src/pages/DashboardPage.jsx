import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

function DashboardPage({ onUpload, onOpenBill }) {
  const { user } = useAuth()

  const [bills, setBills] = useState([])
  const [monthlySpend, setMonthlySpend] = useState([])
  const [loading, setLoading] = useState(true)

  // 📅 Date range for PDF
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // 🔥 SAFE USER ID (STRING)
  const userId = user?.id ? String(user.id) : null

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return

      try {
        const [billsRes, analyticsRes] = await Promise.all([
          axios.get("http://localhost:8000/bills"),
          axios.get("http://localhost:8000/analytics/monthly-spend", {
            params: { user_id: userId }
          })
        ])

        setBills(Array.isArray(billsRes.data) ? billsRes.data : [])
        setMonthlySpend(Array.isArray(analyticsRes.data) ? analyticsRes.data : [])
      } catch (e) {
        console.error("❌ Dashboard load failed", e)
        setBills([])
        setMonthlySpend([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  // 🧠 USER-SCOPED BILLS
  const myBills = useMemo(() => {
    if (!userId) return []
    return bills.filter(b => String(b.user_id) === userId)
  }, [bills, userId])

  // ⬇️ PDF DOWNLOAD HANDLER
  const downloadPdf = () => {
    if (!userId) return

    const params = new URLSearchParams({
      user_id: userId
    })

    if (fromDate) params.append("start_date", fromDate)
    if (toDate) params.append("end_date", toDate)

    window.open(
      `http://localhost:8000/reports/download?${params.toString()}`,
      "_blank"
    )
  }

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
          <p className="muted">Logged in as: {user?.email}</p>
          <p className="muted">User ID: {userId}</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onUpload}>+ Upload New Bill</button>
        </div>
      </div>

      {/* 📄 PDF CONTROLS */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
        />
        <button onClick={downloadPdf}>
          ⬇️ Download PDF Report
        </button>
      </div>

      {/* 📈 MONTHLY SPEND CHART */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>📈 Monthly Spend</h3>
        {monthlySpend.length === 0 ? (
          <p className="muted">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 🧾 BILLS TABLE */}
      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : myBills.length === 0 ? (
        <div className="card">
          <p className="muted">No bills yet.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Store</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {myBills.map(b => (
                <tr
                  key={b.bill_id}
                  onClick={() => onOpenBill(b.bill_id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{b.bill_id}</td>
                  <td>{b.shop_name || "—"}</td>
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
