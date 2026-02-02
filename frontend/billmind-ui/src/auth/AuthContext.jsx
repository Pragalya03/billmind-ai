import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("billmind_user")
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const signup = async (email, password) => {
    const res = await axios.post(
      "http://localhost:8000/auth/signup",
      { email, password }
    )

    const sessionUser = {
      id: String(res.data.user_id), // 🔥 STRING
      email: res.data.email
    }

    localStorage.setItem(
      "billmind_user",
      JSON.stringify(sessionUser)
    )
    setUser(sessionUser)
  }

  const login = async (email, password) => {
    const res = await axios.post(
      "http://localhost:8000/auth/login",
      { email, password }
    )

    const sessionUser = {
      id: String(res.data.user_id), // 🔥 STRING
      email: res.data.email
    }

    localStorage.setItem(
      "billmind_user",
      JSON.stringify(sessionUser)
    )
    setUser(sessionUser)
  }

  const logout = () => {
    localStorage.removeItem("billmind_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, signup, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
