import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, getRedirectUser } from "./lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function initAuth() {
      // Must resolve redirect before subscribing — otherwise onAuthStateChanged(null)
      // can fire first and leave the user stuck on the login screen on mobile.
      try {
        const redirectUser = await getRedirectUser()
        if (!cancelled && redirectUser) {
          setUser(redirectUser)
        }
      } catch (err) {
        console.error("Redirect auth error:", err)
      }

      if (cancelled) return

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!cancelled) {
          setUser(firebaseUser)
          setLoading(false)
        }
      })
    }

    void initAuth()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
