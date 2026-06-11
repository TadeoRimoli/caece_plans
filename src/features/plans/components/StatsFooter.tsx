import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import type { Subject, SubjectStatus } from "../../../types"
import { STATUS_LIST, STATUS_META } from "../../../types"

interface StatsFooterProps {
  subjects: Subject[]
  stats: { total: number; completed: number; percentage: number; averageGrade: number | null }
  onStatusHover?: (status: SubjectStatus | null) => void
}

export function StatsFooter({ subjects, stats, onStatusHover }: StatsFooterProps) {
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const subject of subjects) {
      const count = counts.get(subject.status) || 0
      counts.set(subject.status, count + 1)
    }

    return STATUS_LIST.filter((status) => {
      const count = counts.get(status.value) || 0
      return count > 0
    }).map((status) => ({
      ...status,
      count: counts.get(status.value) || 0,
      meta: STATUS_META[status.value],
    }))
  }, [subjects])

  return (
    <div className="fixed bottom-0 sm:bottom-4 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-30 px-2 sm:px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0 pointer-events-none">
      <div className="pointer-events-auto max-w-[100vw] sm:max-w-none overflow-x-auto hide-scrollbar">
        <div className="inline-flex sm:flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-4 rounded-2xl sm:rounded-full bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-md min-w-0">
          {/* Progress */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-32 h-1.5 sm:h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-emerald-400 tabular-nums">
                  {stats.percentage}%
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                {stats.completed} de {stats.total} materias
              </span>
            </div>

            {stats.averageGrade !== null && (
              <div className="hidden md:flex flex-col ml-2 sm:ml-4 flex-shrink-0">
                <span className="text-[10px] sm:text-xs text-slate-500">Promedio</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-400 tabular-nums">
                  {stats.averageGrade}
                </span>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Status badges */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {statusCounts.map((status) => (
              <div
                key={status.value}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-transform hover:scale-105 flex-shrink-0"
                onMouseEnter={() => onStatusHover?.(status.value as SubjectStatus)}
                onMouseLeave={() => onStatusHover?.(null)}
                style={{
                  backgroundColor: `${status.meta.color}15`,
                  border: `1px solid ${status.meta.color}30`,
                }}
              >
                <div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: status.meta.color,
                    boxShadow: `0 0 6px ${status.meta.color}60`,
                  }}
                />
                <span
                  className="text-[10px] sm:text-xs font-medium tabular-nums"
                  style={{ color: status.meta.color }}
                >
                  {status.count}
                </span>
                <span className="hidden lg:inline text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                  {status.meta.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
