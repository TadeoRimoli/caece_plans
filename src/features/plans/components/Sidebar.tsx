import { X, GraduationCap, Sparkles } from "lucide-react"
import { cn } from "../../../lib/utils"
import type { Career } from "../../../types"

interface SidebarProps {
  open: boolean
  careers: Career[]
  currentCareer: Career | null
  onClose: () => void
  onCareerSelect: (career: Career) => void
}

export function Sidebar({
  open,
  careers,
  currentCareer,
  onClose,
  onCareerSelect,
}: SidebarProps) {
  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 animate-fadeIn"
      />
      <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-slate-900/98 border-r border-white/5 z-50 animate-slideInLeft">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">CAECE</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-2">
            Carreras disponibles
          </p>
          {careers.map((career) => {
            const isActive = currentCareer?.id === career.id
            return (
              <button
                key={career.id}
                onClick={() => {
                  onCareerSelect(career)
                  onClose()
                }}
                className={cn(
                  "w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200",
                  isActive
                    ? "bg-white/10 border border-white/10"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl sm:text-2xl bg-white/5 rounded-lg p-2">
                    {career.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-medium text-white text-sm sm:text-base truncate",
                        isActive && "text-blue-400"
                      )}
                    >
                      {career.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {career.subjects.length} materias • Plan {career.plan}
                    </p>
                  </div>
                  {isActive && (
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </aside>
    </>
  )
}
