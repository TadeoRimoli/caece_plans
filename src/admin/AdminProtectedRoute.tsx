import { memo } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../AuthContext"
import type { ReactNode } from "react"
import { FullPageLoader } from "../components/FullPageLoader"

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID

interface AdminProtectedRouteProps {
  children: ReactNode
}

/**
 * HOC: solo renderiza el panel de admin si el usuario autenticado
 * tiene uid igual a VITE_ADMIN_UID. Si no, redirige a "/".
 */
export const AdminProtectedRoute = memo(function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <FullPageLoader />
  }

  if (!user || user.uid !== ADMIN_UID) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
})
