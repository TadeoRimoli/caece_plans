import { memo, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GraduationCap, BookOpen, BarChart3, Target, TrendingUp, Sparkles } from "lucide-react"
import { loginWithGoogle, logout } from "../lib/firebase"
import { useAuth } from "../AuthContext"
import { isMobileDevice, cn } from "../lib/utils"

// Hoist static Google SVG icon (Rule 6.3)
const GoogleIcon = (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// Hoist static feature list (Rule 6.3)
const FEATURES = [
  { icon: BookOpen, text: "Seguir tu progreso académico en tiempo real" },
  { icon: BarChart3, text: "Ver qué materias has completado y cuáles faltan" },
  { icon: Target, text: "Planificar tu camino hacia la graduación" },
  { icon: TrendingUp, text: "Visualizar tu avance en el plan de estudios" },
] as const

// Animated background with mesh gradient
const AnimatedBackground = memo(function AnimatedBackground() {
  // Memoize inline styles (Rule 7.1)
  const dotPatternStyle = useMemo(() => ({
    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
    backgroundSize: "40px 40px",
  }), [])
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Static gradient orbs - removed animations for performance */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[150px]" />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={dotPatternStyle}
      />
    </div>
  )
})

const PAGE_TITLE = "Visualizador de planes de estudio"

function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    document.title = PAGE_TITLE
  }, [])

  // Memoize handlers to avoid recreations (Rule 5.5 - functional updates)
  const handleLogin = useCallback(async () => {
    try {
      await loginWithGoogle(isMobileDevice())
      navigate("/", { replace: true })
    } catch (err) {
      console.error("Error al loguearse:", err)
    }
  }, [navigate])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
    }
  }, [navigate])

  // Memoize user display name (Rule 5.3 - narrow dependencies)
  const userFirstName = useMemo(() => {
    return user?.displayName?.split(" ")[0] ?? "Usuario"
  }, [user?.displayName])

  const userInitial = useMemo(() => {
    return user?.displayName?.charAt(0) || "U"
  }, [user?.displayName])

  // Already logged in view
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />
        
        <div
          className={cn(
            "relative max-w-md w-full",
            "rounded-3xl overflow-hidden",
            "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
            "border border-white/10",
            "shadow-2xl",
            "animate-modalIn"
          )}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
          
          <div className="relative p-8 text-center">
            {/* Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-50" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {userInitial}
                    </span>
                  </div>
                )}
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Hola, {userFirstName}!
            </h2>
            <p className="text-slate-400 text-sm">{user.email}</p>

            {/* Action buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => navigate("/", { replace: true })}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-semibold",
                  "bg-gradient-to-r from-blue-600 to-blue-500",
                  "hover:from-blue-500 hover:to-blue-400",
                  "text-white shadow-lg shadow-blue-500/25",
                  "transition-all duration-200",
                  "active:scale-[0.98]",
                  "flex items-center justify-center gap-2"
                )}
              >
                <GraduationCap className="w-5 h-5" />
                Ir a mi Plan de Estudios
              </button>

              <button
                onClick={handleLogout}
                className={cn(
                  "w-full py-3 px-6 rounded-2xl font-medium text-sm",
                  "bg-white/5 hover:bg-white/10",
                  "border border-white/10 hover:border-red-500/30",
                  "text-slate-300 hover:text-red-400",
                  "transition-all duration-200",
                  "active:scale-[0.98]"
                )}
              >
                Cerrar Sesión
              </button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-6">
              Desarrollado por{" "}
              <a
                href="https://www.linkedin.com/in/tadeo-rimoli-9aa24b1a7/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 hover:text-blue-500 underline underline-offset-2"
              >
                Tadeo Rimoli
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Login view
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />

      <div
        className={cn(
          "relative max-w-lg w-full",
          "rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
          "border border-white/10",
          "shadow-2xl",
          "animate-modalIn"
        )}
      >
        {/* Top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 blur-[80px]" />

        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-50" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Visualizador de correlativas
            </h1>
            <p className="text-slate-400">
              Tu compañero de estudios universitarios
            </p>
          </div>

          {/* Features */}
          <div className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
            <h3 className="text-sm font-medium text-blue-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              ¿Qué puedes hacer aquí?
            </h3>
            <ul className="space-y-4">
              {FEATURES.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={cn(
              "w-full py-4 px-6 rounded-2xl font-semibold",
              "bg-white/[0.05] hover:bg-white/[0.08]",
              "border border-white/10 hover:border-white/20",
              "text-white",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "flex items-center justify-center gap-3",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            ) : (
              <>
                {GoogleIcon}
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Al iniciar sesión, aceptas que tus datos se guarden de forma segura
          </p>
          <p className="text-center text-xs text-slate-600 mt-4">
            Desarrollado por{" "}
            <a
              href="https://www.linkedin.com/in/tadeo-rimoli-9aa24b1a7/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-700 hover:text-blue-500 underline underline-offset-2"
            >
              Tadeo Rimoli
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
