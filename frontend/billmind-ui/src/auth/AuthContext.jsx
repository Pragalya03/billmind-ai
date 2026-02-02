import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

// simple deterministic hash
function emailToUserId(email) {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("billmind_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = (email) => {
    const fakeUser = {
      id: emailToUserId(email), // ✅ STABLE
      email,
      created_at: new Date().toISOString()
    }

    localStorage.setItem(
      "billmind_user",
      JSON.stringify(fakeUser)
    )
    setUser(fakeUser)
  }

  const signup = (email) => {
    login(email)
  }

  const logout = () => {
    localStorage.removeItem("billmind_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
