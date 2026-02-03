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

  // 🔍 FILTER INPUTS (do NOT auto-search)
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  // 🔥 SAFE USER ID
  const userId = user?.id ? String(user.id) : null

  // ===============================
  // LOAD ALL BILLS (DEFAULT)
  // ===============================
  useEffect(() => {
    if (!userId) return

    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [billsRes, analyticsRes] = await Promise.all([
          axios.get("http://localhost:8000/bills/search", {
            params: { user_id: userId }
          }),
          axios.get("http://localhost:8000/analytics/monthly-spend", {
            params: { user_id: userId }
          })
        ])

        setBills(Array.isArray(billsRes.data) ? billsRes.data : [])
        setMonthlySpend(
          Array.isArray(analyticsRes.data) ? analyticsRes.data : []
        )
      } catch (e) {
        console.error("❌ Dashboard load failed", e)
        setBills([])
        setMonthlySpend([])
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [userId])

  // ===============================
  // SEARCH HANDLER (MANUAL)
  // ===============================
  const runSearch = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const res = await axios.get("http://localhost:8000/bills/search", {
        params: {
          user_id: userId,
          q: search || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          min_amount: minAmount || undefined,
          max_amount: maxAmount || undefined
        }
      })

      setBills(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error("❌ Search failed", e)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  // ===============================
  // CLEAR FILTERS
  // ===============================
  const clearFilters = async () => {
    setSearch("")
    setFromDate("")
    setToDate("")
    setMinAmount("")
    setMaxAmount("")

    if (!userId) return

    setLoading(true)
    try {
      const res = await axios.get("http://localhost:8000/bills/search", {
        params: { user_id: userId }
      })
      setBills(Array.isArray(res.data) ? res.data : [])
    } finally {
      setLoading(false)
    }
  }

  // 🧠 EXTRA SAFETY
  const myBills = useMemo(() => {
    if (!userId) return []
    return bills.filter(b => String(b.user_id) === userId)
  }, [bills, userId])

  // ⬇️ PDF DOWNLOAD (uses date range)
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
        </div>

        <button onClick={onUpload}>+ Upload New Bill</button>
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Search by store name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

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

          <input
            type="number"
            placeholder="Min ₹"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
          />

          <input
            type="number"
            placeholder="Max ₹"
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
          />

          <button onClick={runSearch}>🔍 Search</button>

          <button className="secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* 📄 PDF */}
      <div className="card" style={{ marginBottom: 24 }}>
        <button onClick={downloadPdf}>
          ⬇️ Download PDF Report
        </button>
      </div>

      {/* 📈 MONTHLY SPEND */}
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
          <p className="muted">No bills found.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
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
                  <td>{b.bill_date}</td>
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
