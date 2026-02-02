import { useState } from "react"
import { useAuth } from "../auth/AuthContext"

function LoginPage({ onSuccess, onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")

  const handleLogin = () => {
    if (!email) return alert("Enter email")
    login(email, "customer")
    onSuccess()
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h2>Login to BillMind AI</h2>
        <p className="muted">
          Use any email — fake auth for now
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />

        <button
          style={{ width: "100%", marginTop: 16 }}
          onClick={handleLogin}
        >
          Login
        </button>

        <p
          className="muted"
          style={{ marginTop: 12, cursor: "pointer" }}
          onClick={onSwitch}
        >
          Don’t have an account? Sign up
        </p>
      </div>
    </div>
  )
}

export default LoginPage
