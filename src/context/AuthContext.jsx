import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'auth_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { sessionToken, email, exp } = JSON.parse(raw)
    if (Date.now() > exp) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return { sessionToken, email }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession())

  const login = useCallback((sessionToken, email) => {
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionToken, email, exp }))
    setSession({ sessionToken, email })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, login, logout, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
