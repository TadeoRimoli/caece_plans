import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import type { Subject } from "../../../types"
import { STATUS_LIST, STATUS_META } from "../../../types"

interface StatsFooterProps {
  subjects: Subject[]
  stats: { total: number; completed: number; percentage: number; averageGrade: number | null }
}

export function StatsFooter({ subjects, stats }: StatsFooterProps) {
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-full bg-slate-900/95 border border-white/10 shadow-2xl">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                {stats.percentage}%
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500">
              {stats.completed} de {stats.total} materias
            </span>
          </div>

          {stats.averageGrade !== null && (
            <div className="hidden sm:flex flex-col ml-4">
              <span className="text-[10px] sm:text-xs text-slate-500">
                Promedio final
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                {stats.averageGrade}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Status badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {statusCounts.map((status) => (
            <div
              key={status.value}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-transform hover:scale-105"
              style={{
                backgroundColor: `${status.meta.color}15`,
                border: `1px solid ${status.meta.color}30`,
              }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{
                  backgroundColor: status.meta.color,
                  boxShadow: `0 0 6px ${status.meta.color}60`,
                }}
              />
              <span
                className="text-[10px] sm:text-xs font-medium"
                style={{ color: status.meta.color }}
              >
                {status.count}
              </span>
              <span className="hidden md:inline text-[10px] sm:text-xs text-slate-500">
                {status.meta.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
