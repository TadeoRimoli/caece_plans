import { NavLink, Link, Outlet } from "react-router-dom"
import { Building2, GraduationCap, LogOut } from "lucide-react"
import { logout } from "../lib/firebase"
import { cn } from "../lib/utils"

const nav = [
  { to: "/admin/universities", label: "Universidades", icon: Building2 },
  { to: "/admin/careers", label: "Carreras", icon: GraduationCap },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-white/5 bg-slate-900/95 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Panel de administración</h1>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/"
            className="text-slate-400 hover:text-white text-sm"
          >
            Ir al sitio
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
