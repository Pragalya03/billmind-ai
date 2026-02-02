import { useAuth } from "./AuthContext"

function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return null
  }

  return children
}

export default RequireAuth
