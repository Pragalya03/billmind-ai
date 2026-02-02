import { useEffect, useState } from "react"
import UploadPage from "./pages/UploadPage"
import OCRReviewPage from "./pages/OCRReviewPage"
import FinalBillPage from "./pages/FinalBillPage"
import DashboardPage from "./pages/DashboardPage"

function App() {
  const [appStage, setAppStage] = useState("dashboard")
  const [billId, setBillId] = useState(null)
  const [draftResult, setDraftResult] = useState(null)
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  return (
    <>
      {/* Top Bar */}
      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <strong>BillMind AI</strong>

        <button
          className="secondary"
          onClick={() =>
            setTheme(theme === "light" ? "dark" : "light")
          }
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {appStage === "dashboard" && (
        <DashboardPage
          onUpload={() => setAppStage("upload")}
          onOpenBill={(id) => {
            setBillId(id)
            setAppStage("view")
          }}
        />
      )}

      {appStage === "upload" && (
        <UploadPage
          onUploaded={(data) => {
            setBillId(data.bill_id)
            setDraftResult(data)
            setAppStage("review")
          }}
        />
      )}

      {appStage === "review" && (
        <OCRReviewPage
          billId={billId}
          reviewItems={draftResult?.review_items || []}
          onContinue={() => setAppStage("final")}
        />
      )}

      {appStage === "final" && (
        <FinalBillPage
          billId={billId}
          mode="edit"
          onDone={() => {
            setBillId(null)
            setDraftResult(null)
            setAppStage("dashboard")
          }}
        />
      )}

      {appStage === "view" && (
        <FinalBillPage
          billId={billId}
          mode="readonly"
          onDone={() => setAppStage("dashboard")}
        />
      )}
    </>
  )
}

export default App
