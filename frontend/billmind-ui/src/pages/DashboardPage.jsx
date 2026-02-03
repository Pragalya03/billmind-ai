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

  // 🔍 FILTER INPUTS (manual search only)
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  // 🔐 SAFE USER ID
  const userId = user?.id ? String(user.id) : null

  // ===============================
  // LOAD INITIAL DATA
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
  // SEARCH
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

  // ===============================
  // USER-SAFE FILTER
  // ===============================
  const myBills = useMemo(() => {
    if (!userId) return []
    return bills.filter(b => String(b.user_id) === userId)
  }, [bills, userId])

  // ===============================
  // PDF DOWNLOAD
  // ===============================
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
    <div className="container" style={{ padding: "32px 0" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Dashboard</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Logged in as {user?.email}
          </p>
        </div>

        <button onClick={onUpload} style={{ fontWeight: 500 }}>
          + Upload Bill
        </button>
      </div>

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 16 }}>🔍 Search & Filters</h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12
          }}
        >
          <input
            placeholder="Store name"
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
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button onClick={runSearch}>Search</button>
          <button className="secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* REPORTS */}
      <div
        className="card"
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h4 style={{ marginBottom: 4 }}>📄 Reports</h4>
          <p className="muted" style={{ fontSize: 14 }}>
            Download your bills as a PDF summary
          </p>
        </div>

        <button onClick={downloadPdf}>Download PDF</button>
      </div>

      {/* CHART */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 16 }}>📈 Monthly Spend</h4>

        {monthlySpend.length === 0 ? (
          <p className="muted">No data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#0ea5e9"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* BILLS */}
      {loading ? (
        <p className="muted">Loading bills…</p>
      ) : myBills.length === 0 ? (
        <div className="card">
          <p className="muted">No bills found.</p>
        </div>
      ) : (
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>🧾 Bills</h4>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="muted" style={{ textAlign: "left" }}>
                <th style={{ paddingBottom: 12 }}>Date</th>
                <th style={{ paddingBottom: 12 }}>Store</th>
                <th style={{ paddingBottom: 12, textAlign: "right" }}>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {myBills.map(b => (
                <tr
                  key={b.bill_id}
                  onClick={() => onOpenBill(b.bill_id)}
                  style={{
                    cursor: "pointer",
                    borderTop: "1px solid #e5e7eb"
                  }}
                >
                  <td style={{ padding: "14px 0" }}>{b.bill_date}</td>
                  <td>{b.shop_name || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    ₹ {b.final_total}
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
