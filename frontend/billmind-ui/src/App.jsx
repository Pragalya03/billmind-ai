import { useEffect, useState } from "react"
import UploadPage from "./pages/UploadPage"
import OCRReviewPage from "./pages/OCRReviewPage"
import FinalBillPage from "./pages/FinalBillPage"
import DashboardPage from "./pages/DashboardPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import BillDetails from "./pages/BillDetails"
import { AuthProvider, useAuth } from "./auth/AuthContext"
import RequireAuth from "./auth/RequireAuth"

function AppContent() {
  const { user, loading, logout } = useAuth()

  const [authPage, setAuthPage] = useState("login")
  const [appStage, setAppStage] = useState("dashboard")
  const [billId, setBillId] = useState(null)
  const [draftResult, setDraftResult] = useState(null)
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  if (loading) return null

  // 🔐 AUTH GATE
  if (!user) {
    return authPage === "login" ? (
      <LoginPage
        onSuccess={() => setAuthPage("login")}
        onSwitch={() => setAuthPage("signup")}
      />
    ) : (
      <SignupPage
        onSuccess={() => setAuthPage("login")}
        onSwitch={() => setAuthPage("login")}
      />
    )
  }

  return (
    <RequireAuth>
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

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="secondary"
              onClick={() =>
                setTheme(theme === "light" ? "dark" : "light")
              }
            >
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <button
              onClick={() => {
                logout()
                setBillId(null)
                setDraftResult(null)
                setAppStage("dashboard")
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ========== PROTECTED APP FLOW ========== */}

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
            onDone={() => {
              setBillId(null)
              setDraftResult(null)
              setAppStage("dashboard")
            }}
          />
        )}

        {/* Force remount when billId changes */}
        {appStage === "view" && billId !== null && (
          <BillDetails
            key={billId}
            billId={billId}
            onDone={() => {
              setBillId(null)
              setAppStage("dashboard")
            }}
          />
        )}
      </>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
