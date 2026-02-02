import { useState } from "react"
import UploadPage from "./pages/UploadPage"
import OCRReviewPage from "./pages/OCRReviewPage"
import FinalBillPage from "./pages/FinalBillPage"
import DashboardPage from "./pages/DashboardPage"

function App() {
  const [appStage, setAppStage] = useState("dashboard")
  const [billId, setBillId] = useState(null)
  const [draftResult, setDraftResult] = useState(null)

  return (
    <>
      {appStage === "dashboard" && (
        <DashboardPage
          onUpload={() => setAppStage("upload")}
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
          onDone={() => {
            setBillId(null)
            setDraftResult(null)
            setAppStage("dashboard")
          }}
        />
      )}
    </>
  )
}

export default App
