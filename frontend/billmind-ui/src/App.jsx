import { useState } from "react"
import UploadPage from "./pages/UploadPage"
import OCRReviewPage from "./pages/OCRReviewPage"
import FinalBillPage from "./pages/FinalBillPage"

function App() {
  /**
   * appStage:
   * "upload"  → upload bill
   * "review"  → OCR low-confidence review (Stage 1)
   * "final"   → final bill editing (Stage 2)
   */
  const [appStage, setAppStage] = useState("upload")

  /**
   * Shared bill context
   * This is NOT mutated incorrectly.
   */
  const [billId, setBillId] = useState(null)
  const [draftResult, setDraftResult] = useState(null)
  const [finalResult, setFinalResult] = useState(null)

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
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
          onContinue={() => {
            setAppStage("final")
          }}
        />
      )}

      {appStage === "final" && (
        <FinalBillPage
          billId={billId}
          onDone={() => {
            alert("🎉 Bill flow complete")
            setAppStage("upload")
            setBillId(null)
            setDraftResult(null)
            setFinalResult(null)
          }}
        />
      )}
    </div>
  )
}

export default App
