import { useState } from "react"
import { useAuth } from "../auth/AuthContext"

function SignupPage({ onSuccess, onSwitch }) {
  const { signup } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const handleSignup = async () => {
    try {
      setError(null)
      if (!email || !password) {
        return setError("Email and password required")
      }
      await signup(email, password)
      onSuccess()
    } catch (e) {
      setError(
        e.response?.data?.detail || "Signup failed"
      )
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h2>Create Account</h2>

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
          onClick={handleSignup}
        >
          Sign Up
        </button>

        <p
          className="muted"
          style={{ marginTop: 12, cursor: "pointer" }}
          onClick={onSwitch}
        >
          Already registered? Login
        </p>
      </div>
    </div>
  )
}

export default SignupPage
