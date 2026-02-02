import { useState } from "react"
import { useAuth } from "../auth/AuthContext"

function SignupPage({ onSuccess, onSwitch }) {
  const { signup } = useAuth()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("customer")

  const handleSignup = () => {
    if (!email) return alert("Enter email")
    signup(email, role)
    onSuccess()
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
        <h2>Create your account</h2>
        <p className="muted">Demo mode · no password</p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />

        <div style={{ marginTop: 14 }}>
          <label className="muted">Account type</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <button
          style={{ width: "100%", marginTop: 18 }}
          onClick={handleSignup}
        >
          Sign Up
        </button>

        <p
          className="muted"
          style={{ marginTop: 12, cursor: "pointer" }}
          onClick={onSwitch}
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  )
}

export default SignupPage
