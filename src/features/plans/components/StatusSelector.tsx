import {
  Circle,
  Play,
  ClipboardClock,
  Sparkles,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react"
import { STATUS_LIST, STATUS_META, type SubjectStatus } from "../../../types"
import { cn } from "../../../lib/utils"

const STATUS_CONFIG: Record<
  SubjectStatus,
  { Icon: LucideIcon; hint: string }
> = {
  pending: {
    Icon: Circle,
    hint: "Todavía no la cursaste",
  },
  in_progress: {
    Icon: Play,
    hint: "La estás cursando ahora",
  },
  course_completed: {
    Icon: ClipboardClock,
    hint: "Cursada, falta rendir final",
  },
  promoted: {
    Icon: Sparkles,
    hint: "Promoción directa",
  },
  approved_with_final: {
    Icon: BadgeCheck,
    hint: "Aprobada con final",
  },
}

interface StatusSelectorProps {
  currentStatus: SubjectStatus
  onChange: (status: SubjectStatus) => void
}

export function StatusSelector({ currentStatus, onChange }: StatusSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {STATUS_LIST.map((status) => {
        const meta = STATUS_META[status.value]
        const config = STATUS_CONFIG[status.value]
        const isActive = currentStatus === status.value
        const { Icon } = config

        return (
          <button
            key={status.value}
            type="button"
            onClick={() => onChange(status.value)}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.98]",
              isActive
                ? "bg-white/[0.08] shadow-lg"
                : "bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/15"
            )}
            style={{
              borderColor: isActive ? `${meta.color}55` : undefined,
              boxShadow: isActive ? `0 0 0 1px ${meta.color}30, 0 8px 24px ${meta.color}15` : undefined,
            }}
          >
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200",
                isActive && "scale-105"
              )}
              style={{
                backgroundColor: `${meta.color}18`,
                color: meta.color,
                boxShadow: isActive ? `0 0 20px ${meta.color}25` : undefined,
              }}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  status.value === "in_progress" && "fill-current",
                  status.value === "promoted" && "fill-current/20"
                )}
                strokeWidth={isActive ? 2.25 : 2}
              />
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm font-semibold leading-tight",
                  isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                )}
              >
                {meta.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 leading-snug">
                {config.hint}
              </span>
            </div>

            <div
              className={cn(
                "h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 transition-all",
                isActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
              )}
              style={{
                borderColor: meta.color,
                backgroundColor: meta.color,
                boxShadow: `0 0 8px ${meta.color}`,
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

export const STATUS_HEADER_ICONS: Record<SubjectStatus, LucideIcon> = {
  pending: Circle,
  in_progress: Play,
  course_completed: ClipboardClock,
  promoted: Sparkles,
  approved_with_final: BadgeCheck,
}
