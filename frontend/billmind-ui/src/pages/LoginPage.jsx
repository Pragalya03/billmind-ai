import { useState } from "react"
import { useAuth } from "../auth/AuthContext"

function LoginPage({ onSuccess, onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    try {
      setError(null)
      if (!email || !password) {
        return setError("Email and password required")
      }
      await login(email, password)
      onSuccess()
    } catch (e) {
      setError(
        e.response?.data?.detail || "Login failed"
      )
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h2>Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          New user? Create account
        </p>
      </div>
    </div>
  )
}

export default LoginPage
