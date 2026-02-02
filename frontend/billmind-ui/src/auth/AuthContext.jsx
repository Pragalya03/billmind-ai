import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

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

  const login = (email, role = "customer") => {
    const fakeUser = {
      id: Date.now(),          // user_id placeholder
      email,
      role,                    // customer | vendor
      created_at: new Date().toISOString()
    }

    localStorage.setItem(
      "billmind_user",
      JSON.stringify(fakeUser)
    )
    setUser(fakeUser)
  }

  const signup = (email, role = "customer") => {
    login(email, role)
  }

  const logout = () => {
    localStorage.removeItem("billmind_user")
    setUser(null)
  }

  const isCustomer = user?.role === "customer"
  const isVendor = user?.role === "vendor"

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isCustomer,
        isVendor,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
