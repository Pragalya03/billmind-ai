// import { useEffect, useMemo, useState } from "react"
// import axios from "axios"

// function FinalBillPage({ billId, onDone }) {
//   const [bill, setBill] = useState(null)
//   const [billDate, setBillDate] = useState("")
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)

//   // =========================
//   // REPROCESS BILL
//   // =========================
//   useEffect(() => {
//     const reprocessBill = async () => {
//       try {
//         setLoading(true)
//         const res = await axios.post(
//           "http://localhost:8000/reprocess",
//           { bill_id: billId }
//         )
//         setBill(res.data)

//         // Pre-fill if backend already has a date
//         if (res.data?.header?.bill_date) {
//           setBillDate(res.data.header.bill_date)
//         }
//       } catch (err) {
//         console.error(err)
//         alert("❌ Failed to load final bill")
//       } finally {
//         setLoading(false)
//       }
//     }

//     reprocessBill()
//   }, [billId])

//   // =========================
//   // TABLE EDITING
//   // =========================
//   const updateCell = (rowIndex, field, value) => {
//     const updated = structuredClone(bill)
//     const num = Number(value)

//     updated.table[rowIndex][field] = isNaN(num) ? null : num

//     const r = updated.table[rowIndex]
//     if (r.quantity != null && r.unit_price != null) {
//       r.line_total = Number((r.quantity * r.unit_price).toFixed(2))
//     }

//     setBill(updated)
//   }

//   // =========================
//   // FINAL TOTAL
//   // =========================
//   const frontendTotal = useMemo(() => {
//     if (!bill?.table) return 0
//     return Number(
//       bill.table
//         .filter((r) => r.line_total != null)
//         .reduce((s, r) => s + r.line_total, 0)
//         .toFixed(2)
//     )
//   }, [bill])

//   // =========================
//   // FINALIZE
//   // =========================
//   const finalizeBill = async () => {
//     if (!billDate) {
//       alert("⚠️ Please select the bill date")
//       return
//     }

//     try {
//       setSaving(true)
//       await axios.post("http://localhost:8000/finalize-bill", {
//         bill_id: billId,
//         bill_date: billDate, // ✅ NEW
//         table: bill.table,
//         final_total: frontendTotal,
//         confidence: bill.final_confidence
//       })
//       alert("✅ Bill saved successfully")
//       onDone()
//     } catch (err) {
//       console.error(err)
//       alert("❌ Failed to save bill")
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================
//   // UI STATES
//   // =========================
//   if (loading) {
//     return (
//       <div className="container" style={{ padding: "64px 0" }}>
//         <p className="muted">Preparing final bill…</p>
//       </div>
//     )
//   }

//   if (!bill) {
//     return (
//       <div className="container" style={{ padding: "64px 0" }}>
//         <p className="muted">No bill data available.</p>
//       </div>
//     )
//   }

//   // =========================
//   // UI
//   // =========================
//   return (
//     <div className="container" style={{ padding: "48px 0", maxWidth: 1100 }}>
//       {/* HEADER */}
//       <div style={{ marginBottom: 32 }}>
//         <h1 style={{ marginBottom: 6 }}>
//           {bill.header?.shop_name || "Store"}
//         </h1>
//         <p className="muted">{bill.header?.address}</p>
//       </div>

//       {/* META */}
//       <div
//         className="card"
//         style={{
//           marginBottom: 32,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           padding: 24
//         }}
//       >
//         <div>
//           <label className="muted" style={{ fontSize: 13 }}>
//             Bill date
//           </label>
//           <input
//             type="date"
//             value={billDate}
//             onChange={(e) => setBillDate(e.target.value)}
//             style={{ marginTop: 4 }}
//           />
//         </div>

//         <div style={{ textAlign: "right" }}>
//           <div className="muted" style={{ fontSize: 13 }}>
//             Final total
//           </div>
//           <div style={{ fontSize: 32, fontWeight: 700 }}>
//             ₹ {frontendTotal}
//           </div>
//         </div>
//       </div>

//       {/* BILL ITEMS */}
//       <div className="card" style={{ marginBottom: 40 }}>
//         <h3 style={{ marginBottom: 20 }}>Bill items</h3>

//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead>
//             <tr className="muted" style={{ textAlign: "left" }}>
//               <th style={{ paddingBottom: 12 }}>Item</th>
//               <th style={{ paddingBottom: 12 }}>Qty</th>
//               <th style={{ paddingBottom: 12 }}>Unit Price</th>
//               <th style={{ paddingBottom: 12, textAlign: "right" }}>
//                 Line Total
//               </th>
//               <th style={{ paddingBottom: 12, textAlign: "center" }}>
//                 Status
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             {bill.table.map((row, idx) => {
//               const incomplete =
//                 row.quantity == null || row.unit_price == null

//               return (
//                 <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
//                   <td style={{ padding: "16px 0" }}>{row.item}</td>

//                   <td>
//                     {row.quantity ?? (
//                       <input
//                         type="number"
//                         onBlur={(e) =>
//                           updateCell(idx, "quantity", e.target.value)
//                         }
//                         style={{ width: 80 }}
//                       />
//                     )}
//                   </td>

//                   <td>
//                     {row.unit_price ?? (
//                       <input
//                         type="number"
//                         onBlur={(e) =>
//                           updateCell(idx, "unit_price", e.target.value)
//                         }
//                         style={{ width: 100 }}
//                       />
//                     )}
//                   </td>

//                   <td style={{ textAlign: "right", fontWeight: 500 }}>
//                     {row.line_total ?? "—"}
//                   </td>

//                   <td style={{ textAlign: "center" }}>
//                     {incomplete ? "⚠️" : "✅"}
//                   </td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* FINAL ACTION */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           borderTop: "1px solid #e5e7eb",
//           paddingTop: 24
//         }}
//       >
//         <p className="muted" style={{ fontSize: 14 }}>
//           The bill date and totals will be saved permanently.
//         </p>

//         <button
//           onClick={finalizeBill}
//           disabled={saving}
//           style={{ padding: "14px 24px", fontSize: 16, fontWeight: 600 }}
//         >
//           {saving ? "Saving…" : "Finalize Bill"}
//         </button>
//       </div>
//     </div>
//   )
// }

// export default FinalBillPage

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

function FinalBillPage({ billId, onDone }) {
  const [bill, setBill] = useState(null)
  const [billDate, setBillDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // =========================
  // UNIT DISPLAY (DUMMY LOGIC)
  // =========================
  const getUnit = (itemName) => {
    if (!itemName) return ""
    const name = itemName.toLowerCase()

    if (["rice", "salt"].some(k => name.includes(k))) return "kg"
    if (name.includes("milk")) return "ltr"
    if (name.includes("pepper")) return "gms"

    return ""
  }

  // =========================
  // REPROCESS BILL
  // =========================
  useEffect(() => {
    const reprocessBill = async () => {
      try {
        setLoading(true)
        const res = await axios.post(
          "http://localhost:8000/reprocess",
          { bill_id: billId }
        )
        setBill(res.data)

        if (res.data?.header?.bill_date) {
          setBillDate(res.data.header.bill_date)
        }
      } catch (err) {
        console.error(err)
        alert("❌ Failed to load final bill")
      } finally {
        setLoading(false)
      }
    }

    reprocessBill()
  }, [billId])

  // =========================
  // TABLE EDITING
  // =========================
  const updateCell = (rowIndex, field, value) => {
    const updated = structuredClone(bill)
    const num = Number(value)

    updated.table[rowIndex][field] = isNaN(num) ? null : num

    const r = updated.table[rowIndex]
    if (r.quantity != null && r.unit_price != null) {
      r.line_total = Number((r.quantity * r.unit_price).toFixed(2))
    }

    setBill(updated)
  }

  // =========================
  // FINAL TOTAL
  // =========================
  const frontendTotal = useMemo(() => {
    if (!bill?.table) return 0
    return Number(
      bill.table
        .filter((r) => r.line_total != null)
        .reduce((s, r) => s + r.line_total, 0)
        .toFixed(2)
    )
  }, [bill])

  // =========================
  // FINALIZE
  // =========================
  const finalizeBill = async () => {
    if (!billDate) {
      alert("⚠️ Please select the bill date")
      return
    }

    try {
      setSaving(true)
      await axios.post("http://localhost:8000/finalize-bill", {
        bill_id: billId,
        bill_date: billDate,
        table: bill.table,
        final_total: frontendTotal,
        confidence: bill.final_confidence
      })
      alert("✅ Bill saved successfully")
      onDone()
    } catch (err) {
      console.error(err)
      alert("❌ Failed to save bill")
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return (
      <div className="container" style={{ padding: "64px 0" }}>
        <p className="muted">Preparing final bill…</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="container" style={{ padding: "64px 0" }}>
        <p className="muted">No bill data available.</p>
      </div>
    )
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="container" style={{ padding: "48px 0", maxWidth: 1100 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 6 }}>
          {bill.header?.shop_name || "Store"}
        </h1>
        <p className="muted">{bill.header?.address}</p>
      </div>

      {/* META */}
      <div
        className="card"
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 24
        }}
      >
        <div>
          <label className="muted" style={{ fontSize: 13 }}>
            Bill date
          </label>
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Final total
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            ₹ {frontendTotal}
          </div>
        </div>
      </div>

      {/* BILL ITEMS */}
      <div className="card" style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 20 }}>Bill items</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr className="muted" style={{ textAlign: "left" }}>
              <th style={{ paddingBottom: 12 }}>Item</th>
              <th style={{ paddingBottom: 12 }}>Qty</th>
              <th style={{ paddingBottom: 12 }}>Unit Price</th>
              <th style={{ paddingBottom: 12, textAlign: "right" }}>
                Line Total
              </th>
              <th style={{ paddingBottom: 12, textAlign: "center" }}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {bill.table.map((row, idx) => {
              const incomplete =
                row.quantity == null || row.unit_price == null

              const unit = getUnit(row.item)

              return (
                <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px 0" }}>{row.item}</td>

                  <td>
                    {row.quantity != null ? (
                      <span>
                        {row.quantity}
                        {unit && (
                          <span className="muted" style={{ marginLeft: 6 }}>
                            {unit}
                          </span>
                        )}
                      </span>
                    ) : (
                      <input
                        type="number"
                        onBlur={(e) =>
                          updateCell(idx, "quantity", e.target.value)
                        }
                        style={{ width: 80 }}
                      />
                    )}
                  </td>

                  <td>
                    {row.unit_price ?? (
                      <input
                        type="number"
                        onBlur={(e) =>
                          updateCell(idx, "unit_price", e.target.value)
                        }
                        style={{ width: 100 }}
                      />
                    )}
                  </td>

                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {row.line_total ?? "—"}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {incomplete ? "⚠️" : "✅"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* FINAL ACTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #e5e7eb",
          paddingTop: 24
        }}
      >
        <p className="muted" style={{ fontSize: 14 }}>
          The bill date and totals will be saved permanently.
        </p>

        <button
          onClick={finalizeBill}
          disabled={saving}
          style={{ padding: "14px 24px", fontSize: 16, fontWeight: 600 }}
        >
          {saving ? "Saving…" : "Finalize Bill"}
        </button>
      </div>
    </div>
  )
}

export default FinalBillPage
