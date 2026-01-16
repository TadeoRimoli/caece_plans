import { memo } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./views/Login"
import Plans from "./views/Plans"
import type { JSX } from "react"
import { useAuth, AuthProvider } from "./AuthContext"

// Memoized protected route to avoid unnecessary re-renders (Rule 5.2)
const ProtectedRoute = memo(({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  // Explicit conditional rendering (Rule 6.7)
  if (loading) return <p>Cargando...</p>
  return user ? children : <Navigate to="/login" replace />
})
ProtectedRoute.displayName = 'ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
