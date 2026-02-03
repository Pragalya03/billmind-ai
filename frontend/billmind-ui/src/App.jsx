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
        {/* Top App Bar */}
<div
  style={{
    padding: "14px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    background: "var(--card)",
    position: "sticky",
    top: 0,
    zIndex: 10
  }}
>
  {/* Logo + Brand */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <img
      src="/icon.png"
      alt="BillMind AI"
      style={{
        height: 36,
        width: 36,
        objectFit: "contain"
      }}
    />

    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        BillMind AI
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        Smart Bill Intelligence
      </div>
    </div>
  </div>

  {/* Actions */}
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
      className="danger"
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
